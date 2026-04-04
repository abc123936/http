import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  FlatList,
  Alert,
  TextInput,
  Modal,
  TouchableOpacity,
  Platform,
} from "react-native";

type GroupItem = {
  id: string;
  name: string;
  muted: boolean;
};

export default function ScreenGroupList({ navigation }: any) {
  const [groups, setGroups] = useState<GroupItem[]>([
    { id: "1", name: "阿嬤家群組", muted: false },
    { id: "2", name: "溫暖的小窩", muted: true },
    { id: "3", name: "朋友家", muted: false },
  ]);

  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, query]);

  // 三點選單狀態
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuGroupId, setMenuGroupId] = useState<string | null>(null);

  const openMenu = (groupId: string) => {
    setMenuGroupId(groupId);
    setMenuOpen(true);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setMenuGroupId(null);
  };

  const getGroup = () => groups.find((g) => g.id === menuGroupId);

  // 切換通知開關
  const toggleMute = () => {
    const g = getGroup();
    if (!g) return;
    const nextMuted = !g.muted;
    setGroups((prev) =>
      prev.map((x) => (x.id === g.id ? { ...x, muted: nextMuted } : x)),
    );
    closeMenu();
    Alert.alert("推播設定", nextMuted ? "已關閉推播" : "已開啟推播");
  };

  // --- 修正後的退出群組邏輯 ---
  const leaveGroup = () => {
    const g = getGroup();
    if (!g) return;

    // 先存下要處理的資訊，避免 Modal 關閉時 menuGroupId 變成 null
    const targetId = g.id;
    const targetName = g.name;

    // 1. 先關閉 Modal (避免 UI 衝突)
    setMenuOpen(false);

    // 2. 稍微延遲後再彈出 Alert (確保網頁版順暢)
    setTimeout(() => {
      Alert.alert(
        "退出群組",
        `確定要退出「${targetName}」嗎？`,
        [
          { text: "取消", style: "cancel", onPress: () => setMenuGroupId(null) },
          {
            text: "確定退出",
            style: "destructive",
            onPress: () => {
              setGroups((prev) => prev.filter((x) => x.id !== targetId));
              setMenuGroupId(null);
            },
          },
        ]
      );
    }, Platform.OS === "web" ? 100 : 10);
  };

  // 進入審核頁面 (由選單觸發)
  const reviewMembers = () => {
    const g = getGroup();
    if (!g) return;
    closeMenu();
    navigation.navigate("ReviewMembers", { group: g });
  };

  // 進入成員列表 (點擊橫幅觸發)
  const openMembers = (g: GroupItem) => {
    navigation.navigate("MemberList", { group: g });
  };

  const renderHeader = (title: string) => (
    <View style={styles.header}>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {renderHeader("查詢群組")}

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="搜尋群組"
            placeholderTextColor="#9ca3af"
            style={[
              styles.searchInput,
              Platform.OS === "web" && ({ outlineStyle: "none" } as any),
            ]}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={10}>
              <Text style={styles.searchClear}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: 10, paddingBottom: 16 }}
        renderItem={({ item }) => (
          <Pressable onPress={() => openMembers(item)} style={styles.card}>
            <Text style={styles.groupName}>{item.name}</Text>

            <View style={styles.rightIcons}>
              {/* 喇叭按鈕 */}
              <Pressable
                onPress={(e) => {
                  e.stopPropagation(); // 阻止點擊整條 card
                  Alert.alert(
                    "通知狀態",
                    item.muted ? "目前：推播已關閉" : "目前：推播已開啟"
                  );
                }}
                style={styles.iconBtn}
              >
                <Bell muted={item.muted} />
              </Pressable>

              {/* 選單按鈕 */}
              <Pressable
                onPress={(e) => {
                  e.stopPropagation(); // 阻止點擊整條 card
                  openMenu(item.id);
                }}
                style={styles.iconBtn}
              >
                <Text style={styles.icon}>⋯</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
      />

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeMenu}>
          <View style={{ flex: 1 }} />
        </Pressable>

        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <TouchableOpacity style={styles.sheetItem} onPress={toggleMute}>
            <Text style={styles.sheetText}>
              {getGroup()?.muted ? "開啟推播" : "關閉推播"}
            </Text>
          </TouchableOpacity>

          <View style={styles.sheetDivider} />

          <TouchableOpacity style={styles.sheetItem} onPress={reviewMembers}>
            <Text style={styles.sheetText}>審核新成員是否加入群組</Text>
          </TouchableOpacity>

          <View style={styles.sheetDivider} />

          <TouchableOpacity style={styles.sheetItem} onPress={leaveGroup}>
            <Text style={[styles.sheetText, { color: "#ef4444" }]}>退出群組</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sheetItem, { marginTop: 8 }]}
            onPress={closeMenu}
          >
            <Text style={[styles.sheetText, { color: "#6b7280" }]}>取消</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Bell({ muted }: { muted: boolean }) {
  return (
    <View style={styles.bellWrap}>
      <Text style={styles.bellText}>{muted ? "🔇" : "🔈"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  headerTitleContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 6 },
  searchBox: {
    height: 46,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: "#111827" },
  searchClear: { fontSize: 16, color: "#6b7280", fontWeight: "800" },
  card: {
    height: 60,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  groupName: { fontSize: 15, fontWeight: "700", color: "#111827" },
  rightIcons: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: { padding: 6 },
  icon: { fontSize: 18, color: "#111827" },
  bellWrap: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  bellText: { fontSize: 18 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    paddingBottom: 24,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    alignSelf: "center",
    marginBottom: 12,
  },
  sheetItem: { paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12 },
  sheetText: { fontSize: 15, fontWeight: "800", color: "#111827" },
  sheetDivider: { height: 1, backgroundColor: "#f3f4f6" },
});