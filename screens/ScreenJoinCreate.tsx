import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Alert, SafeAreaView, Clipboard } from "react-native";
import { useGroups } from "../context/GroupContext";

export default function ScreenJoinCreate({ navigation }: any) {
  const [isCreate, setIsCreate] = useState(true);
  const [groupName, setGroupName] = useState("");
  const [joinId, setJoinId] = useState("");
  const { createGroup, joinGroupById } = useGroups();

  const handleCreate = async () => {
    if (!groupName.trim()) return Alert.alert("提示", "請輸入群組名稱");
    
    const generatedId = await createGroup(groupName);
    
    Alert.alert(
      "群組創建成功",
      `您的群組代碼為：${generatedId}\n請複製此代碼並發送給成員。`,
      [
        { text: "複製代碼", onPress: () => {
          Clipboard.setString(generatedId);
          setGroupName("");
          setIsCreate(false); // 切換到加入頁面方便測試
        }},
        { text: "確定", onPress: () => setGroupName("") }
      ]
    );
  };

  const handleJoin = async () => {
    if (!joinId.trim()) return Alert.alert("提示", "請輸入群組 ID");
    const success = await joinGroupById(joinId.toUpperCase());
    if (success) {
      Alert.alert("加入成功", "已成功加入該群組！", [
        { text: "好", onPress: () => navigation.navigate("Home") }
      ]);
    } else {
      Alert.alert("錯誤", "無效的代碼，請重新確認");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}><Text>〈</Text></Pressable>
        <Text style={styles.headerTitle}>群組管理</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.tabWrapper}>
        <Pressable onPress={() => setIsCreate(true)} style={[styles.tabBtn, isCreate && styles.activeTab]}>
          <Text style={[styles.tabText, isCreate && styles.activeText]}>創建群組</Text>
        </Pressable>
        <Pressable onPress={() => setIsCreate(false)} style={[styles.tabBtn, !isCreate && styles.activeTab]}>
          <Text style={[styles.tabText, !isCreate && styles.activeText]}>加入群組</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {isCreate ? (
          <View style={styles.card}>
            <Text style={styles.label}>群組名稱</Text>
            <TextInput value={groupName} onChangeText={setGroupName} placeholder="輸入名稱..." style={styles.input} />
            <Pressable onPress={handleCreate} style={styles.btn}><Text style={styles.btnText}>獲取群組代碼</Text></Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.label}>輸入群組代碼</Text>
            <TextInput value={joinId} onChangeText={(t) => setJoinId(t.toUpperCase())} placeholder="在此貼上代碼..." style={styles.input} />
            <Pressable onPress={handleJoin} style={styles.btn}><Text style={styles.btnText}>立即加入</Text></Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { height: 50, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#eee" },
  backBtn: { width: 44, alignItems: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontWeight: "800" },
  tabWrapper: { flexDirection: "row", padding: 16, gap: 10 },
  tabBtn: { flex: 1, height: 44, backgroundColor: "#f3f4f6", borderRadius: 10, justifyContent: "center", alignItems: "center" },
  activeTab: { backgroundColor: "#111827" },
  tabText: { color: "#666", fontWeight: "700" },
  activeText: { color: "#fff" },
  content: { padding: 16 },
  card: { padding: 20, backgroundColor: "#f9fafb", borderRadius: 20 },
  label: { fontSize: 13, color: "#666", marginBottom: 8, fontWeight: "700" },
  input: { height: 50, backgroundColor: "#fff", borderWidth: 1, borderColor: "#ddd", borderRadius: 10, paddingHorizontal: 15, marginBottom: 20 },
  btn: { height: 50, backgroundColor: "#111827", borderRadius: 10, justifyContent: "center", alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "800" }
});