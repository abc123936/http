import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

interface Member { userId: string; userName: string; role: "管理員" | "成員"; status: "正常" | "可疑"; }
interface Group { id: string; name: string; status: "正常" | "可疑"; createdAt: number; members: Member[]; muted: boolean; }
interface PendingMember { userId: string; userName: string; groupId: string; }

interface GroupContextType {
  groups: Group[]; 
  setGroups: (update: Group[] | ((prev: Group[]) => Group[])) => void;
  createGroup: (groupName: string) => Promise<string>; 
  joinGroupById: (id: string) => Promise<boolean>;
  pendingRequests: PendingMember[];
  handleReview: (userId: string, groupId: string, isApprove: boolean) => Promise<void>;
  getGroupMembers: (groupId: string) => Member[];
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);
const MY_GROUPS_KEY = "fc_my_groups_v3";
const GLOBAL_DB_KEY = "fc_global_db_v3"; 

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

  // 🌟 修正：此處僅將資料存入「全域庫」，絕對不呼叫 setGroups
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

    const rawGlobal = await AsyncStorage.getItem(GLOBAL_DB_KEY);
    const globalDB = rawGlobal ? JSON.parse(rawGlobal) : [];
    
    // 存入全域資料庫 (模擬後端)
    await AsyncStorage.setItem(GLOBAL_DB_KEY, JSON.stringify([newGroup, ...globalDB]));
    
    return newId; 
  };

  // 🌟 加入：手動貼上 ID 後，才從全域庫撈資料並存入 setGroups
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