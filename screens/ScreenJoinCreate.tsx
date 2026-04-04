import React, { useMemo, useState } from "react";
import {
  Alert,
  SafeAreaView,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  View,
  ScrollView,
  StatusBar,
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useGroups } from "../context/GroupContext";

type Mode = "create" | "join";

type Group = {
  id: string;
  name: string;
  createdAt: number;
};

export default function ScreenJoinCreate() {
  const { groups, addGroup } = useGroups();
  const [mode, setMode] = useState<Mode>("create");
  const [groupName, setGroupName] = useState("");
  const [created, setCreated] = useState<Group | null>(null);
  const [joinId, setJoinId] = useState("");

  const groupMap = useMemo(() => {
    const m = new Map<string, any>();
    groups.forEach((g) => m.set(g.id, g));
    return m;
  }, [groups]);

  const onCreate = async () => {
    const name = groupName.trim();
    if (!name) {
      Alert.alert("請輸入群組名稱");
      return;
    }
    try {
      const newGroup = await addGroup(name);
      setCreated(newGroup);
      setGroupName("");
      Alert.alert("已創建完成", `群組名稱：${name}`);
    } catch (e) {
      Alert.alert("錯誤", "無法創建群組");
    }
  };

  const onCopyId = async () => {
    if (!created?.id) return;
    await Clipboard.setStringAsync(created.id);
    Alert.alert("已複製群組 ID", created.id);
  };

  const onJoin = async () => {
    const id = joinId.trim().toUpperCase();
    if (!id) {
      Alert.alert("請輸入群組 ID");
      return;
    }
    const g = groupMap.get(id);
    if (!g) {
      Alert.alert("找不到此群組", "請確認 ID 是否正確。");
      return;
    }
    Alert.alert("已加入", `群組名稱：${g.name}`);
    setJoinId("");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>加入 / 創建</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.tabs}>
          <Pressable
            onPress={() => { setMode("create"); setCreated(null); }}
            style={[styles.tab, mode === "create" && styles.tabActive]}
          >
            <Text style={[styles.tabText, mode === "create" && styles.tabTextActive]}>創建</Text>
          </Pressable>
          <Pressable
            onPress={() => { setMode("join"); setCreated(null); }}
            style={[styles.tab, mode === "join" && styles.tabActive]}
          >
            <Text style={[styles.tabText, mode === "join" && styles.tabTextActive]}>加入</Text>
          </Pressable>
        </View>

        {mode === "create" ? (
          <View style={styles.card}>
            <Text style={styles.label}>群組名稱</Text>
            <TextInput
              value={groupName}
              onChangeText={setGroupName}
              placeholder="例如：家人群 / 朋友群"
              placeholderTextColor="#9ca3af"
              style={[styles.input, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
            />
            <Text style={[styles.label, { marginTop: 14 }]}>群組 ID（創建後固定）</Text>
            <View style={styles.idRow}>
              <View style={[styles.input, styles.idBox]}>
                <Text style={styles.idText}>{created?.id ?? "（尚未創建）"}</Text>
              </View>
              <Pressable
                onPress={onCopyId}
                style={[styles.copyBtn, !created?.id && styles.copyBtnDisabled]}
                disabled={!created?.id}
              >
                <Text style={styles.copyText}>複製</Text>
              </Pressable>
            </View>
            <Pressable onPress={onCreate} style={styles.primaryBtn}>
              <Text style={styles.primaryText}>確認創建</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.label}>輸入群組 ID</Text>
            <TextInput
              value={joinId}
              onChangeText={setJoinId}
              placeholder="貼上群組 ID"
              placeholderTextColor="#9ca3af"
              style={[styles.input, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
              autoCapitalize="characters"
            />
            <Pressable onPress={onJoin} style={styles.primaryBtn}>
              <Text style={styles.primaryText}>確認加入</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.listTitle}>已記錄群組（本機共享）</Text>
        {groups.length === 0 ? (
          <Text style={styles.empty}>目前還沒有記錄任何群組</Text>
        ) : (
          groups.map((g) => (
            <View key={g.id} style={styles.groupRow}>
              <Text style={styles.groupName}>{g.name}</Text>
              <Text style={styles.groupId}>{g.id}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: { height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  headerTitleContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  body: { paddingHorizontal: 14, paddingBottom: 24 },
  tabs: { flexDirection: "row", gap: 10, marginBottom: 10 },
  tab: { flex: 1, height: 44, borderRadius: 12, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  tabActive: { backgroundColor: "#111827" },
  tabText: { fontSize: 14, fontWeight: "800", color: "#111827" },
  tabTextActive: { color: "#fff" },
  card: { backgroundColor: "#f3f4f6", borderRadius: 14, padding: 14 },
  label: { fontSize: 13, fontWeight: "800", color: "#111827", marginBottom: 8 },
  input: { height: 52, borderRadius: 12, backgroundColor: "#e5e7eb", paddingHorizontal: 12, fontSize: 15, color: "#111827", ...Platform.select({ web: { cursor: "text" } as any }) },
  idRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  idBox: { flex: 1, justifyContent: "center" },
  idText: { fontSize: 14, fontWeight: "800", color: "#111827" },
  copyBtn: { height: 52, paddingHorizontal: 14, borderRadius: 12, backgroundColor: "#111827", alignItems: "center", justifyContent: "center" },
  copyBtnDisabled: { backgroundColor: "#9ca3af" },
  copyText: { color: "#fff", fontWeight: "900" },
  primaryBtn: { marginTop: 14, height: 52, borderRadius: 12, backgroundColor: "#111827", alignItems: "center", justifyContent: "center" },
  primaryText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  listTitle: { marginTop: 16, marginBottom: 10, fontSize: 13, fontWeight: "900", color: "#111827" },
  empty: { fontSize: 12, color: "#6b7280" },
  groupRow: { padding: 12, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 10 },
  groupName: { fontSize: 14, fontWeight: "900", color: "#111827" },
  groupId: { marginTop: 4, fontSize: 12, fontWeight: "700", color: "#6b7280" },
});