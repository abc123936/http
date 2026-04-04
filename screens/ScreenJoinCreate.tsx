import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Alert, SafeAreaView, KeyboardAvoidingView, Platform } from "react-native";
import { useGroups } from "../context/GroupContext";

export default function ScreenJoinCreate({ navigation }: any) {
  const [isCreate, setIsCreate] = useState(true);
  const [name, setName] = useState("");
  const [joinId, setJoinId] = useState("");
  const { addGroup, joinGroupById } = useGroups();

  const onCreate = async () => {
    if (!name.trim()) return Alert.alert("錯誤", "請輸入群組名稱");
    const newGroup = await addGroup(name);
    Alert.alert("成功", `群組「${newGroup.name}」已創建！`, [
      { text: "好", onPress: () => navigation.navigate("Home") }
    ]);
  };

  const onJoin = async () => {
    if (!joinId.trim()) return Alert.alert("錯誤", "請輸入群組 ID");
    const success = await joinGroupById(joinId.toUpperCase());
    if (success) {
      Alert.alert("申請已發送", "請等待管理員審核");
      navigation.goBack();
    } else {
      Alert.alert("錯誤", "找不到該群組 ID");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>〈</Text>
          </Pressable>
          <Text style={styles.title}>加入或創建群組</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.tabContainer}>
          <Pressable onPress={() => setIsCreate(true)} style={[styles.tab, isCreate && styles.activeTab]}>
            <Text style={[styles.tabText, isCreate && styles.activeTabText]}>創建群組</Text>
          </Pressable>
          <Pressable onPress={() => setIsCreate(false)} style={[styles.tab, !isCreate && styles.activeTab]}>
            <Text style={[styles.tabText, !isCreate && styles.activeTabText]}>加入群組</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          {isCreate ? (
            <View style={styles.card}>
              <Text style={styles.label}>群組名稱</Text>
              <TextInput value={name} onChangeText={setName} placeholder="例如：我的家人" style={styles.input} />
              <Pressable onPress={onCreate} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>確認創建</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.label}>輸入群組 ID</Text>
              <TextInput value={joinId} onChangeText={(t) => setJoinId(t.toUpperCase())} placeholder="例如：7CD9QCC" style={styles.input} />
              <Pressable onPress={onJoin} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>申請加入</Text>
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { height: 60, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#eee" },
  backBtn: { width: 44, alignItems: "center" },
  backIcon: { fontSize: 20 },
  title: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "800" },
  tabContainer: { flexDirection: "row", padding: 16, gap: 12 },
  tab: { flex: 1, height: 44, borderRadius: 12, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" },
  activeTab: { backgroundColor: "#111827" },
  tabText: { fontSize: 15, color: "#6b7280", fontWeight: "700" },
  activeTabText: { color: "#fff" },
  content: { padding: 16 },
  card: { padding: 20, backgroundColor: "#f9fafb", borderRadius: 20 },
  label: { fontSize: 14, fontWeight: "700", color: "#4b5563", marginBottom: 8 },
  input: { height: 50, backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 16, fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: "#e5e7eb" },
  primaryBtn: { height: 50, backgroundColor: "#111827", borderRadius: 12, justifyContent: "center", alignItems: "center" },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});