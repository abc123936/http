import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

interface Member {
  userId: string;
  userName: string;
  role: "管理員" | "成員";
  status: "正常" | "可疑";
}

interface Group {
  id: string;
  name: string;
  status: "正常" | "可疑";
  createdAt: number;
  members: Member[];
}

interface PendingMember {
  userId: string;
  userName: string;
  groupId: string;
}

interface GroupContextType {
  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>; // 讓外部能直接更新(如退出群組)
  addGroup: (name: string) => Promise<Group>;
  joinGroupById: (id: string) => Promise<boolean>;
  pendingRequests: PendingMember[];
  handleReview: (userId: string, groupId: string, isApprove: boolean) => void;
  getGroupMembers: (groupId: string) => Member[];
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);
const STORAGE_KEY = "fc_groups_v1";

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingMember[]>([
    { userId: "user_01", userName: "小明", groupId: "7CD9QCC668HP" },
  ]);

  useEffect(() => {
    loadLocalGroups();
  }, []);

  // 監聽 groups 變動並存檔，這樣「退出群組」後才會真的存下來
  useEffect(() => {
    if (groups.length > 0) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
    }
  }, [groups]);

  const loadLocalGroups = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setGroups(JSON.parse(raw));
    } catch (e) {
      console.error("讀取群組失敗", e);
    }
  };

  const addGroup = async (name: string) => {
    const newGroup: Group = {
      id: Math.random().toString(36).substring(2, 10).toUpperCase(),
      name,
      status: "正常",
      createdAt: Date.now(),
      members: [{ userId: "me", userName: "我", role: "管理員", status: "正常" }],
    };
    setGroups(prev => [newGroup, ...prev]);
    return newGroup;
  };

  const joinGroupById = async (id: string) => {
    const exists = groups.find((g) => g.id === id);
    return !!exists;
  };

  const handleReview = (userId: string, groupId: string, isApprove: boolean) => {
    console.log(`處理審核: ${userId}, 通過: ${isApprove}`);

    if (isApprove) {
      const applicant = pendingRequests.find(req => req.userId === userId);
      if (applicant) {
        setGroups(prevGroups => {
          return prevGroups.map(g => {
            if (g.id === groupId) {
              const alreadyMember = g.members.some(m => m.userId === userId);
              if (alreadyMember) return g;
              const newMember: Member = {
                userId: applicant.userId,
                userName: applicant.userName,
                role: "成員",
                status: "正常",
              };
              return { ...g, members: [...g.members, newMember] };
            }
            return g;
          });
        });
        Alert.alert("審核成功", `${applicant.userName} 已加入群組`);
      }
    }

    // 更新待處理清單
    setPendingRequests(prev => prev.filter(req => req.userId !== userId));
  };

  const getGroupMembers = (groupId: string) => {
    return groups.find(g => g.id === groupId)?.members || [];
  };

  return (
    <GroupContext.Provider
      value={{ groups, setGroups, addGroup, joinGroupById, pendingRequests, handleReview, getGroupMembers }}
    >
      {children}
    </GroupContext.Provider>
  );
};

export const useGroups = () => {
  const context = useContext(GroupContext);
  if (!context) throw new Error("useGroups 必須在 GroupProvider 內使用");
  return context;
};