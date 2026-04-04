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

// 2. 擴充 Group 型別，加入 members 陣列
interface Group {
  id: string;
  name: string;
  status: "正常" | "可疑";
  createdAt: number;
  members: Member[]; // 👈 新增這行
}

interface PendingMember {
  userId: string;
  userName: string;
  groupId: string;
}

interface GroupContextType {
  groups: Group[];
  addGroup: (name: string) => Promise<Group>;
  joinGroupById: (id: string) => Promise<boolean>;
  pendingRequests: PendingMember[];
  handleReview: (userId: string, groupId: string, isApprove: boolean) => void;
  getGroupMembers: (groupId: string) => Member[]; // 👈 新增：方便獲取成員
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

const STORAGE_KEY = "fc_groups_v1";

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingMember[]>([
    { userId: "user_01", userName: "小明", groupId: "7CD9QCC668HP" }, 
  ]);

  useEffect(() => {
    loadLocalGroups();
  }, []);

  const loadLocalGroups = async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) setGroups(JSON.parse(raw));
  };

  const saveGroups = async (nextGroups: Group[]) => {
    setGroups(nextGroups);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextGroups));
  };

  const addGroup = async (name: string) => {
    const newGroup: Group = {
      id: Math.random().toString(36).substring(2, 10).toUpperCase(),
      name,
      status: "正常",
      createdAt: Date.now(),
      // 預設建立者就是管理員
      members: [{ userId: "me", userName: "我", role: "管理員", status: "正常" }],
    };
    const next = [newGroup, ...groups];
    await saveGroups(next);
    return newGroup;
  };

  const joinGroupById = async (id: string) => {
    const exists = groups.find((g) => g.id === id);
    return !!exists;
  };

  // --- 關鍵修改：審核通過後的邏輯 ---
  const handleReview = (
    userId: string,
    groupId: string,
    isApprove: boolean,
  ) => {
    if (isApprove) {
      // 找到那個被審核的申請人資訊
      const applicant = pendingRequests.find(req => req.userId === userId);
      
      if (applicant) {
        // 更新 groups 狀態：將新成員加入對應群組的 members 陣列中
        const nextGroups = groups.map((g) => {
          if (g.id === groupId) {
            // 檢查是否已經在裡面了
            const isExist = g.members.some(m => m.userId === userId);
            if (isExist) return g;

            const newMember: Member = {
              userId: applicant.userId,
              userName: applicant.userName,
              role: "成員",
              status: "正常", // 預設通過後為正常
            };
            return { ...g, members: [...g.members, newMember] };
          }
          return g;
        });

        saveGroups(nextGroups); // 儲存到本地
        Alert.alert("審核成功", `${applicant.userName} 已正式加入群組`);
      }
    }

    // 無論通過或拒絕，都從待審核清單移除
    setPendingRequests((prev) => prev.filter((req) => req.userId !== userId));
  };

  // 輔助函式：根據 ID 拿成員
  const getGroupMembers = (groupId: string) => {
    return groups.find(g => g.id === groupId)?.members || [];
  };

  return (
    <GroupContext.Provider
      value={{ groups, addGroup, joinGroupById, pendingRequests, handleReview, getGroupMembers }}
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