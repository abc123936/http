import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useGroups } from "../context/GroupContext";

export default function ScreenJoinCreate({ navigation }: any) {
  const [isCreate, setIsCreate] = useState(true);
  const [name, setName] = useState("");
  const [joinId, setJoinId] = useState("");
  
  // 從 Context 引入修正後的函式
  const { addGroup, joinGroupById } = useGroups();

  // 處理創建群組
  const onCreate = async () => {
    if (!name.trim()) {
      Alert.alert("提示", "請輸入群組名稱");
      return;
    }
    try {
      const newGroup = await addGroup(name);
      Alert.alert("成功", `群組「${newGroup.name}」已創建！`, [
        { text: "好", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert("錯誤", "創建失敗，請稍後再試");
    }
  };

  // 處理加入群組
  const onJoin = async () => {
    if (!joinId.trim()) {
      Alert.alert("提示", "請輸入群組 ID");
      return;
    }
    const success = await joinGroupById(joinId.toUpperCase());
    if (success) {
      Alert.alert("申請成功", "已發送加入申請，請等待管理員審核", [
        { text: "確定", onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert("錯誤", "找不到該群組 ID，請重新確認");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* Header 區塊 */}
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backIcon}>〈</Text>
            </Pressable>
            <Text style={styles.headerTitle}>加入或創建群組</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Tab 切換區塊 */}
          <View style={styles.tabWrapper}>
            <Pressable 
              onPress={() => setIsCreate(true)} 
              style={[styles.tabBtn, isCreate && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, isCreate && styles.tabTextActive]}>創建群組</Text>
            </Pressable>
            <Pressable 
              onPress={() => setIsCreate(false)} 
              style={[styles.tabBtn, !isCreate && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, !isCreate && styles.tabTextActive]}>加入群組</Text>
            </Pressable>
          </View>

          {/* 主要輸入內容區 (依據你的截圖邏輯) */}
          <View style={styles.formContainer}>
            {isCreate ? (
              <View style={styles.card}>
                <Text style={styles.label}>輸入群組名稱</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="輸入名稱..."
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
                <Pressable onPress={onCreate} style={styles.primaryBtn}>
                  <Text style={styles.primaryText}>確認創建</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.label}>輸入群組 ID</Text>
                <TextInput
                  value={joinId}
                  onChangeText={(t) => setJoinId(t.toUpperCase())}
                  placeholder="例如：7CD9QCC"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                  autoCapitalize="characters"
                />
                <Pressable onPress={onJoin} style={styles.primaryBtn}>
                  <Text style={styles.primaryText}>確認加入</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  backBtn: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  backIcon: { fontSize: 20, color: "#111827" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#111827" },
  tabWrapper: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  tabBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  tabBtnActive: { backgroundColor: "#111827" },
  tabText: { fontSize: 15, fontWeight: "700", color: "#6b7280" },
  tabTextActive: { color: "#fff" },
  formContainer: { padding: 16 },
  card: {
    backgroundColor: "#f9fafb",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    color: "#4b5563",
    marginBottom: 12,
  },
  input: {
    height: 54,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 24,
  },
  primaryBtn: {
    height: 54,
    backgroundColor: "#111827",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    // 陰影
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});