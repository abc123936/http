import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

interface Member { userId: string; userName: string; role: "管理員" | "成員"; status: "正常" | "可疑"; }
interface Group { id: string; name: string; status: "正常" | "可疑"; createdAt: number; members: Member[]; muted: boolean; }
interface PendingMember { userId: string; userName: string; groupId: string; }

interface GroupContextType {
  groups: Group[]; // 使用者已加入的群組
  setGroups: (update: Group[] | ((prev: Group[]) => Group[])) => void;
  createGroup: (groupName: string) => Promise<string>; // 只回傳 ID
  joinGroupById: (id: string) => Promise<boolean>;
  pendingRequests: PendingMember[];
  handleReview: (userId: string, groupId: string, isApprove: boolean) => Promise<void>;
  getGroupMembers: (groupId: string) => Member[];
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);
const STORAGE_KEY = "fc_my_groups_v3";
const GLOBAL_GROUPS_KEY = "fc_global_db_v3"; // 模擬遠端資料庫

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [groups, _setGroups] = useState<Group[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingMember[]>([]);

  // 同步存檔
  const setGroups = useCallback((update: Group[] | ((prev: Group[]) => Group[])) => {
    _setGroups((prev) => {
      const next = typeof update === "function" ? update(prev) : update;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return [...next];
    });
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => { if (raw) _setGroups(JSON.parse(raw)); });
  }, []);

  // 🌟 創建群組：只存入「全球資料庫」，不存入「我的群組」
  const createGroup = async (groupName: string) => {
    const newId = Math.random().toString(36).substring(2, 9).toUpperCase();
    const newGroup: Group = {
      id: newId,
      name: groupName,
      status: "正常",
      createdAt: Date.now(),
      muted: false,
      members: [{ userId: "admin", userName: "管理員", role: "管理員", status: "正常" }],
    };

    // 模擬存入後端資料庫
    const rawGlobal = await AsyncStorage.getItem(GLOBAL_GROUPS_KEY);
    const globalDB = rawGlobal ? JSON.parse(rawGlobal) : [];
    await AsyncStorage.setItem(GLOBAL_GROUPS_KEY, JSON.stringify([newGroup, ...globalDB]));
    
    return newId; // 回傳代碼供複製
  };

  // 🌟 加入群組：從「全球資料庫」找代碼
  const joinGroupById = async (id: string) => {
    const rawGlobal = await AsyncStorage.getItem(GLOBAL_GROUPS_KEY);
    const globalDB: Group[] = rawGlobal ? JSON.parse(rawGlobal) : [];
    
    const found = globalDB.find(g => g.id === id);
    if (found) {
      // 這裡模擬：如果是自己創的或直接加入，就塞進我的列表
      // 實務上這裡會進入 pendingRequests，但為了讓你看到效果，我們直接加入
      if (!groups.some(g => g.id === id)) {
        setGroups(prev => [...prev, found]);
      }
      return true;
    }
    return false;
  };

  const handleReview = async (userId: string, groupId: string, isApprove: boolean) => {
    setPendingRequests(prev => prev.filter(r => r.userId !== userId));
  };

  const getGroupMembers = (groupId: string) => groups.find(g => g.id === groupId)?.members || [];

  return (
    <GroupContext.Provider value={{ groups, setGroups, createGroup, joinGroupById, pendingRequests, handleReview, getGroupMembers }}>
      {children}
    </GroupContext.Provider>
  );
};

export const useGroups = () => {
  const c = useContext(GroupContext);
  if (!c) throw new Error("useGroups error");
  return c;
};