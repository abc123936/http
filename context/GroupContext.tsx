import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

// 1. 定義成員型別
interface Member {
  userId: string;
  userName: string;
  role: "管理員" | "成員";
  status: "正常" | "可疑";
}

// 2. 定義群組型別 (已修正：加入 muted 屬性)
interface Group {
  id: string;
  name: string;
  status: "正常" | "可疑";
  createdAt: number;
  members: Member[];
  muted: boolean; // 👈 解決 ScreenGroupList 報錯的關鍵
}

interface PendingMember {
  userId: string;
  userName: string;
  groupId: string;
}

interface GroupContextType {
  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  addGroup: (name: string) => Promise<Group>;
  joinGroupById: (id: string) => Promise<boolean>;
  pendingRequests: PendingMember[];
  handleReview: (userId: string, groupId: string, isApprove: boolean) => void;
  getGroupMembers: (groupId: string) => Member[];
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);
const STORAGE_KEY = "fc_groups_v1";

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingMember[]>([
    { userId: "user_01", userName: "小明", groupId: "7CD9QCC668HP" }, // 預設測試資料
  ]);

  // 初始化：從本地讀取資料
  useEffect(() => {
    loadLocalGroups();
  }, []);

  // 持久化：只要 groups 有變動就自動存入 AsyncStorage
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
      console.error("載入失敗", e);
    }
  };

  // 創建群組
  const addGroup = async (name: string) => {
    const newGroup: Group = {
      id: Math.random().toString(36).substring(2, 10).toUpperCase(),
      name,
      status: "正常",
      createdAt: Date.now(),
      muted: false, // 👈 初始值
      members: [
        { userId: "me", userName: "我", role: "管理員", status: "正常" },
      ],
    };
    setGroups((prev) => [newGroup, ...prev]);
    return newGroup;
  };

  const joinGroupById = async (id: string) => {
    const exists = groups.find((g) => g.id === id);
    return !!exists;
  };

  // 審核邏輯
  const handleReview = (
    userId: string,
    groupId: string,
    isApprove: boolean
  ) => {
    if (isApprove) {
      const applicant = pendingRequests.find((req) => req.userId === userId);
      if (applicant) {
        setGroups((prevGroups) =>
          prevGroups.map((g) => {
            if (g.id === groupId) {
              // 檢查是否已存在
              const isExist = g.members.some((m) => m.userId === userId);
              if (isExist) return g;

              const newMember: Member = {
                userId: applicant.userId,
                userName: applicant.userName,
                role: "成員",
                status: "正常",
              };
              return { ...g, members: [...g.members, newMember] };
            }
            return g;
          })
        );
        Alert.alert("審核成功", `${applicant.userName} 已正式加入群組`);
      }
    }

    // 從待審核清單移除
    setPendingRequests((prev) => prev.filter((req) => req.userId !== userId));
  };

  const getGroupMembers = (groupId: string) => {
    return groups.find((g) => g.id === groupId)?.members || [];
  };

  return (
    <GroupContext.Provider
      value={{
        groups,
        setGroups,
        addGroup,
        joinGroupById,
        pendingRequests,
        handleReview,
        getGroupMembers,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
};

export const useGroups = () => {
  const context = useContext(GroupContext);
  if (!context)
    throw new Error("useGroups must be used within a GroupProvider");
  return context;
};