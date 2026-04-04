import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

interface Member { userId: string; userName: string; role: "管理員" | "成員"; status: "正常" | "可疑"; }
interface Group { id: string; name: string; status: "正常" | "可疑"; createdAt: number; members: Member[]; muted: boolean; }
interface PendingMember { userId: string; userName: string; groupId: string; }

interface GroupContextType {
  groups: Group[]; 
  setGroups: (update: Group[] | ((prev: Group[]) => Group[])) => void;
  addGroup: (name: string) => Promise<string>; // 修改：回傳 String ID
  joinGroupById: (id: string) => Promise<boolean>; // 修改：比對 ID
  pendingRequests: PendingMember[];
  handleReview: (userId: string, groupId: string, isApprove: boolean) => Promise<void>;
  getGroupMembers: (groupId: string) => Member[];
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);
const MY_GROUPS_KEY = "fc_my_groups_v3";
const GLOBAL_DB_KEY = "fc_global_db_v3"; // 模擬遠端資料庫

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [groups, _setGroups] = useState<Group[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingMember[]>([]);

  const setGroups = useCallback((update: Group[] | ((prev: Group[]) => Group[])) => {
    _setGroups((prev) => {
      const next = typeof update === "function" ? update(prev) : update;
      AsyncStorage.setItem(MY_GROUPS_KEY, JSON.stringify(next));
      return [...next];
    });
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(MY_GROUPS_KEY).then(raw => { if (raw) _setGroups(JSON.parse(raw)); });
  }, []);

  // 🌟 恢復原始功能：僅存入全球庫，不影響首頁 groups
  const addGroup = async (name: string) => {
    const newId = Math.random().toString(36).substring(2, 10).toUpperCase();
    const newGroup: Group = {
      id: newId,
      name,
      status: "正常",
      createdAt: Date.now(),
      muted: false,
      members: [{ userId: "admin", userName: "管理員", role: "管理員", status: "正常" }],
    };

    // 存入模擬的全球資料庫
    const rawGlobal = await AsyncStorage.getItem(GLOBAL_DB_KEY);
    const globalDB = rawGlobal ? JSON.parse(rawGlobal) : [];
    await AsyncStorage.setItem(GLOBAL_DB_KEY, JSON.stringify([newGroup, ...globalDB]));
    
    return newId; // 只回傳 ID 供使用者複製
  };

  // 🌟 恢復原始功能：手動輸入 ID 比對後才加入首頁
  const joinGroupById = async (id: string) => {
    const rawGlobal = await AsyncStorage.getItem(GLOBAL_DB_KEY);
    const globalDB: Group[] = rawGlobal ? JSON.parse(rawGlobal) : [];
    
    const found = globalDB.find(g => g.id === id);
    if (found) {
      if (!groups.some(g => g.id === id)) {
        setGroups(prev => [...prev, found]); // 這裡才真正讓它出現在首頁
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
    <GroupContext.Provider value={{ groups, setGroups, addGroup, joinGroupById, pendingRequests, handleReview, getGroupMembers }}>
      {children}
    </GroupContext.Provider>
  );
};

export const useGroups = () => {
  const c = useContext(GroupContext);
  if (!c) throw new Error("useGroups error");
  return c;
};