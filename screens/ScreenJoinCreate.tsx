import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  SafeAreaView,
  ScrollView,
  Clipboard,
  Platform,
  Modal,
  TouchableOpacity
} from "react-native";
import { useGroups } from "../context/GroupContext";

export default function ScreenJoinCreate({ navigation }: any) {
  const [isCreate, setIsCreate] = useState(true);
  const [groupNameInput, setGroupNameInput] = useState("");
  const [joinId, setJoinId] = useState("");
  const [createdGroupId, setCreatedGroupId] = useState(""); // 用於創建時顯示 ID

  // 從 Context 引入
  const { groups, createGroup, joinGroupById } = useGroups();

  // 處理創建群組
  const handleCreateGroup = async () => {
    if (!groupNameInput.trim()) return Alert.alert("提示", "請輸入群組名稱");
    
    try {
      // 創立群組並拿到 ID
      const newId = await createGroup(groupNameInput);
      setCreatedGroupId(newId); // 將 ID 顯示在畫面上

      Alert.alert(
        "獲取成功",
        `群組代碼：${newId}\n\n請複製此代碼，並切換到「加入群組」貼上。`,
        [
          { 
            text: "複製代碼", 
            onPress: () => {
              Clipboard.setString(newId);
              // 不自動清空，讓使用者看得到
              // setIsCreate(false); // 不自動切換，讓使用者決定
            }
          },
          { text: "確定", onPress: () => {} }
        ]
      );
    } catch (e) {
      Alert.alert("錯誤", "創建失敗，請稍後再試");
    }
  };

  // 處理加入群組
  const handleJoinGroup = async () => {
    if (!joinId.trim()) return Alert.alert("提示", "請輸入群組 ID");
    
    try {
      const success = await joinGroupById(joinId.toUpperCase());
      
      if (success) {
        // 🌟 還原之前的加入成功彈窗
        Alert.alert(
          "已加入",
          "申請已發送，請等待管理員審核", // 配合 handleReview 邏輯
          [
            { text: "確定", onPress: () => navigation.navigate("Home") }
          ]
        );
        setJoinId(""); // 加入成功後清空
      } else {
        Alert.alert("錯誤", "無效的代碼，請重新確認");
      }
    } catch (e) {
      Alert.alert("錯誤", "網路異常，請稍後再試");
    }
  };

  // 複製按鈕
  const handleCopy = () => {
    if (!createdGroupId) return;
    Clipboard.setString(createdGroupId);
    Alert.alert("已複製", "群組 ID 已複製到剪貼簿");
  };

  // 🌟 還原：渲染「已記錄群組（本機）」列表
  const renderLocalGroupsList = () => (
    <View style={styles.localListWrapper}>
      <Text style={styles.localListTitle}>已記錄群組（本機）</Text>
      {groups.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>目前尚無記錄</Text>
        </View>
      ) : (
        groups.map((g) => (
          <Pressable 
            key={g.id} 
            style={styles.localItem}
            onPress={() => {
              // 🌟 點擊後將資料填入上方
              if (isCreate) {
                setGroupNameInput(g.name);
                setCreatedGroupId(g.id);
              } else {
                setJoinId(g.id);
              }
            }}
          >
            <Text style={styles.itemGroupName}>{g.name}</Text>
            <Text style={styles.itemGroupId}>{g.id}</Text>
          </Pressable>
        ))
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBack}>
          <Text style={styles.headerBackIcon}>〈</Text>
        </Pressable>
        <Text style={styles.headerTitle}>加入或創建群組</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerClose}>
          <Text style={styles.headerCloseIcon}>✕</Text>
        </Pressable>
      </View>

      {/* Tab */}
      <View style={styles.tabWrapper}>
        <Pressable onPress={() => setIsCreate(true)} style={[styles.tab, isCreate && styles.activeTab]}>
          <Text style={[styles.tabText, isCreate && styles.activeTabText]}>創建群組</Text>
        </Pressable>
        <Pressable onPress={() => setIsCreate(false)} style={[styles.tab, !isCreate && styles.activeTab]}>
          <Text style={[styles.tabText, !isCreate && styles.activeTabText]}>加入群組</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isCreate ? (
          // 🌟 創立模式：豐富 UI 版 (image_7.png)
          <View style={styles.formCard}>
            <Text style={styles.label}>群組名稱</Text>
            <TextInput
              value={groupNameInput}
              onChangeText={setGroupNameInput}
              placeholder="family" // 配合截圖
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />

            <View style={styles.idLabelRow}>
              <Text style={styles.label}>群組 ID（創建後固定）</Text>
            </View>
            <View style={styles.idInputWrapper}>
              <TextInput
                value={createdGroupId}
                editable={false} // 不可編輯
                placeholder="創建後會顯示代碼"
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
              />
              <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
                <Text style={styles.copyBtnText}>複製</Text>
              </TouchableOpacity>
            </View>

            <Pressable onPress={handleCreateGroup} style={styles.primaryBtn}>
              <Text style={styles.primaryText}>獲取群組代碼</Text>
            </Pressable>
          </View>
        ) : (
          // 🌟 加入模式：image_6.png
          <View style={styles.formCard}>
            <Text style={styles.label}>輸入群組 ID</Text>
            <TextInput
              value={joinId}
              onChangeText={(t) => setJoinId(t.toUpperCase())}
              placeholder="貼上代碼..."
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />
            <Pressable onPress={handleJoinGroup} style={styles.primaryBtn}>
              <Text style={styles.primaryText}>確認加入</Text>
            </Pressable>
          </View>
        )}

        {/* 🌟 還原：下方本機清單 */}
        {renderLocalGroupsList()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerBack: { width: 44, justifyContent: "center", alignItems: "center" },
  headerBackIcon: { fontSize: 20, color: "#111827" },
  headerTitle: { fontSize: 17, fontWeight: "900", color: "#111827" },
  headerClose: { width: 44, justifyContent: "center", alignItems: "center" },
  headerCloseIcon: { fontSize: 20, color: "#111827" },
  tabWrapper: { flexDirection: "row", padding: 16, gap: 12 },
  tab: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  activeTab: { backgroundColor: "#111827" },
  tabText: { fontSize: 15, fontWeight: "700", color: "#6b7280" },
  activeTabText: { color: "#fff" },
  scrollContent: { padding: 16 },
  formCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    marginBottom: 20,
  },
  label: { fontSize: 14, fontWeight: "800", color: "#4b5563", marginBottom: 12 },
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
  idLabelRow: { flexDirection: "row", justifyContent: "space-between" },
  idInputWrapper: { flexDirection: "row", gap: 10, marginBottom: 24 },
  copyBtn: {
    width: 60,
    height: 54,
    backgroundColor: "#f3f4f6",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  copyBtnText: { color: "#111827", fontWeight: "700", fontSize: 14 },
  primaryBtn: {
    height: 54,
    backgroundColor: "#111827",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  localListWrapper: { marginTop: 10, paddingBottom: 20 },
  localListTitle: { fontSize: 15, fontWeight: "800", color: "#111827", marginBottom: 12, paddingLeft: 4 },
  localItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemGroupName: { fontSize: 16, fontWeight: "800", color: "#111827" },
  itemGroupId: { fontSize: 13, color: "#9ca3af", marginTop: 4, letterSpacing: 0.5 },
  emptyBox: { alignItems: "center", marginTop: 20 },
  emptyText: { color: "#9ca3af", fontSize: 14 },
});