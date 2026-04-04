import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Alert, SafeAreaView, ScrollView, Clipboard } from "react-native";
import { useGroups } from "../context/GroupContext";

export default function ScreenJoinCreate({ navigation }: any) {
  const [isCreate, setIsCreate] = useState(true);
  const [name, setName] = useState("");
  const [joinId, setJoinId] = useState("");
  const { addGroup, joinGroupById } = useGroups();

  const onCreate = async () => {
    if (!name.trim()) return Alert.alert("提示", "請輸入群組名稱");
    
    // 呼叫恢復後的 addGroup，僅獲取代碼
    const generatedId = await addGroup(name);
    
    Alert.alert(
      "獲取成功",
      `群組代碼：${generatedId}\n\n請複製此代碼，並切換到「加入群組」分頁貼上。`,
      [
        { 
          text: "複製代碼", 
          onPress: () => {
            Clipboard.setString(generatedId);
            setName("");
            setIsCreate(false); // 自動幫你切換到加入分頁
          }
        },
        { text: "確定", onPress: () => setName("") }
      ]
    );
  };

  const onJoin = async () => {
    if (!joinId.trim()) return Alert.alert("提示", "請輸入群組代碼");
    const success = await joinGroupById(joinId.toUpperCase());
    if (success) {
      Alert.alert("加入成功", "您已成功加入群組！", [
        { text: "前往首頁", onPress: () => navigation.navigate("Home") }
      ]);
    } else {
      Alert.alert("錯誤", "無效的代碼，請重新確認");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>〈</Text>
        </Pressable>
        <Text style={styles.headerTitle}>加入或創建群組</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.tabWrapper}>
        <Pressable onPress={() => setIsCreate(true)} style={[styles.tabBtn, isCreate && styles.tabBtnActive]}>
          <Text style={[styles.tabText, isCreate && styles.tabTextActive]}>創建群組</Text>
        </Pressable>
        <Pressable onPress={() => setIsCreate(false)} style={[styles.tabBtn, !isCreate && styles.tabBtnActive]}>
          <Text style={[styles.tabText, !isCreate && styles.tabTextActive]}>加入群組</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.formContainer}>
        {isCreate ? (
          <View style={styles.card}>
            <Text style={styles.label}>輸入群組名稱</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="名稱..."
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />
            <Pressable onPress={onCreate} style={styles.primaryBtn}>
              <Text style={styles.primaryText}>獲取群組代碼</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.label}>輸入群組代碼</Text>
            <TextInput
              value={joinId}
              onChangeText={(t) => setJoinId(t.toUpperCase())}
              placeholder="在此貼上代碼..."
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />
            <Pressable onPress={onJoin} style={styles.primaryBtn}>
              <Text style={styles.primaryText}>確認加入</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { height: 56, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  backBtn: { width: 44, justifyContent: "center", alignItems: "center" },
  backIcon: { fontSize: 20, color: "#111827" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "800", color: "#111827" },
  tabWrapper: { flexDirection: "row", padding: 16, gap: 12 },
  tabBtn: { flex: 1, height: 48, borderRadius: 14, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" },
  tabBtnActive: { backgroundColor: "#111827" },
  tabText: { fontSize: 15, fontWeight: "700", color: "#6b7280" },
  tabTextActive: { color: "#fff" },
  formContainer: { padding: 16 },
  card: { backgroundColor: "#f9fafb", borderRadius: 24, padding: 24, borderWidth: 1, borderColor: "#f3f4f6" },
  label: { fontSize: 14, fontWeight: "800", color: "#4b5563", marginBottom: 12 },
  input: { height: 54, backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 16, fontSize: 16, color: "#111827", borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 24 },
  primaryBtn: { height: 54, backgroundColor: "#111827", borderRadius: 14, justifyContent: "center", alignItems: "center" },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});