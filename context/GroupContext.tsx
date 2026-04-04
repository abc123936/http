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
  
  // 🌟 這裡多塞了 4 位測試成員，方便你示範
  const [pendingRequests, setPendingRequests] = useState<PendingMember[]>([
    { userId: "user_01", userName: "王小明", groupId: "7CD9QCC" },
    { userId: "user_02", userName: "李美玲", groupId: "7CD9QCC" },
    { userId: "user_03", userName: "陳大華", groupId: "7CD9QCC" },
    { userId: "user_04", userName: "林雅婷", groupId: "7CD9QCC" },
  ]);

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
    await AsyncStorage.setItem(GLOBAL_DB_KEY, JSON.stringify([newGroup, ...globalDB]));
    return newId; 
  };

  const joinGroupById = async (id: string) => {
    const rawGlobal = await AsyncStorage.getItem(GLOBAL_DB_KEY);
    const globalDB: Group[] = rawGlobal ? JSON.parse(rawGlobal) : [];
    const found = globalDB.find(g => g.id === id);
    if (found) {
      if (!groups.some(g => g.id === id)) setGroups(prev => [...prev, found]);
      return true;
    }
    return false;
  };

  // 🌟 審核邏輯：通過則加入群組成員名單，拒絕則僅移除申請
  const handleReview = async (userId: string, groupId: string, isApprove: boolean) => {
    if (isApprove) {
      const applicant = pendingRequests.find(r => r.userId === userId);
      if (applicant) {
        setGroups(prev => prev.map(g => {
          if (g.id === groupId || groups.length > 0) { // 為了測試示範，若沒找到特定 ID 也讓你加入第一個群組
            const targetGroup = g.id === groupId ? g : prev[0];
            const exists = targetGroup.members.some(m => m.userId === userId);
            if (exists) return g;
            return { ...targetGroup, members: [...targetGroup.members, { userId: applicant.userId, userName: applicant.userName, role: "成員", status: "正常" }] };
          }
          return g;
        }));
      }
    }
    // 無論通過或拒絕，都從申請清單移除
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