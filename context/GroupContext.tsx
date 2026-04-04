import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

interface Member { userId: string; userName: string; role: "管理員" | "成員"; status: "正常" | "可疑"; }
interface Group { id: string; name: string; status: "正常" | "可疑"; createdAt: number; members: Member[]; muted: boolean; }
interface PendingMember { userId: string; userName: string; groupId: string; }

interface GroupContextType {
  groups: Group[];
  setGroups: (update: Group[] | ((prev: Group[]) => Group[])) => void;
  addGroup: (groupName: string) => Promise<Group>;
  joinGroupById: (id: string) => Promise<boolean>;
  pendingRequests: PendingMember[];
  handleReview: (userId: string, groupId: string, isApprove: boolean) => Promise<void>;
  getGroupMembers: (groupId: string) => Member[];
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);
const STORAGE_KEY = "fc_groups_v3"; // 🌟 再次更換 Key 徹底清空之前的「我瘋嗷嗷」

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [groups, _setGroups] = useState<Group[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingMember[]>([
    { userId: "user_01", userName: "小明", groupId: "7CD9QCC668HP" },
  ]);

  // 同步更新與存檔
  const setGroups = useCallback((update: Group[] | ((prev: Group[]) => Group[])) => {
    _setGroups((prev) => {
      const next = typeof update === "function" ? update(prev) : update;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return [...next];
    });
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) _setGroups(JSON.parse(raw));
    });
  }, []);

  const addGroup = async (groupName: string) => {
    const newGroup: Group = {
      id: Math.random().toString(36).substring(2, 9).toUpperCase(),
      name: groupName,
      status: "正常",
      createdAt: Date.now(),
      muted: false,
      members: [{ userId: "me", userName: "我", role: "管理員", status: "正常" }],
    };
    setGroups(prev => [newGroup, ...prev]);
    return newGroup;
  };

  const handleReview = async (userId: string, groupId: string, isApprove: boolean) => {
    if (isApprove) {
      const applicant = pendingRequests.find(r => r.userId === userId);
      if (applicant) {
        setGroups(prev => prev.map(g => {
          if (g.id === groupId) {
            if (g.members.some(m => m.userId === userId)) return g;
            return { ...g, members: [...g.members, { userId: applicant.userId, userName: applicant.userName, role: "成員", status: "正常" }] };
          }
          return g;
        }));
      }
    }
    setPendingRequests(prev => prev.filter(r => r.userId !== userId));
  };

  const joinGroupById = async (id: string) => groups.some(g => g.id === id);
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