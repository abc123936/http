import React, { useState, useEffect } from "react";
import {
  Alert,
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  Image, // 🌟 新增：用來顯示圖片
} from "react-native";
// 🌟 新增：引入 image picker
import * as ImagePicker from 'expo-image-picker';

export default function ScreenMe() {
  const lineId = "XXXX-XXXX";
  const [nickname, setNickname] = React.useState("使用者暱稱");
  const [showId, setShowId] = React.useState(true); 
  const [notificationsOff, setNotificationsOff] = React.useState(false); 

  // 🌟 新增：用來儲存選取的頭像網址 (預設為 null)
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // 🌟 邏輯優化：修改頭像功能 (iOS 專用)
  const onChangeAvatar = async () => {
    // 1. 在 iPhone 上，需要先詢問相簿權限
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('權限不足', '抱歉，我們需要相簿存取權限才能修改頭像。', [{ text: '好的' }]);
        return; // 使用者拒絕，停止往下執行
      }
    }

    // 2. 彈出 Alert，讓使用者選擇
    Alert.alert(
      "修改頭像",
      "請選擇圖片來源",
      [
        {
          text: "從相簿選取",
          onPress: pickImageFromLibrary,
        },
        {
          text: "取消",
          style: "cancel",
        },
      ]
    );
  };

  // 🚀 從相簿選取圖片的邏輯
  const pickImageFromLibrary = async () => {
    // 開啟相簿元件
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // 只顯示圖片
      allowsEditing: true, // 允許裁剪 (iPhone 常用)
      aspect: [1, 1], // 強制裁剪成 1:1 正方形
      quality: 0.8, // 圖片品質 (0~1)
    });

    console.log('圖片選取結果:', result);

    if (!result.canceled) {
      // 3. 🌟 最關鍵的一步：更新 State，畫面就會看到新照片！
      // 這裡要拿 assets 裡的 uri
      const pickedUri = result.assets[0].uri;
      setAvatarUri(pickedUri);
      Alert.alert("獲取成功", "頭像已更新");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>個人設定</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 1) 修改頭像 - 已升級為可顯示圖片 */}
        <Pressable onPress={onChangeAvatar} style={styles.avatarSection}>
          {/* 🌟 修改點：判斷如果有 avatarUri 就顯示圖片，否則顯示灰色圓圈 */}
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarCircle} />
          ) : (
            <View style={styles.avatarCircle} /> // 原本的灰色圓圈
          )}
          <Text style={styles.avatarLabel}>修改頭像</Text>
        </Pressable>

        <View style={styles.divider} />

        {/* 2) 修改暱稱 */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>修改暱稱</Text>
        </View>
        <TextInput
          value={nickname}
          onChangeText={setNickname}
          style={[
            styles.input,
            Platform.OS === "web" && ({ outlineStyle: "none" } as any),
          ]}
          placeholder="輸入暱稱"
          placeholderTextColor="#9ca3af"
        />

        <View style={styles.divider} />

        {/* 3) 顯示 ID */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>顯示 ID</Text>
          <OX value={showId} onChange={setShowId} />
        </View>
        {showId ? (
          <Text style={styles.hint}>Line ID：{lineId}</Text>
        ) : (
          <Text style={styles.hintMuted}>Line ID 已隱藏</Text>
        )}

        <View style={styles.divider} />

        {/* 4) 是否關閉通知 */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>是否關閉通知</Text>
          <OX value={notificationsOff} onChange={setNotificationsOff} />
        </View>
        <Text style={styles.hintMuted}>
          {notificationsOff ? "通知已關閉" : "通知已開啟"}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// 圈圈/叉叉元件保留
function OX({ value, onChange }: { value: boolean; onChange: (v: boolean) => void; }) {
  return (
    <View style={styles.oxWrap}>
      <Pressable onPress={() => onChange(true)} style={[styles.oxBtn, value && styles.oxBtnActive]}>
        <Text style={[styles.oxText, value && styles.oxTextActive]}>○</Text>
      </Pressable>
      <Pressable onPress={() => onChange(false)} style={[styles.oxBtn, !value && styles.oxBtnActive]}>
        <Text style={[styles.oxText, !value && styles.oxTextActive]}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: { height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  headerTitleContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "900", color: "#111827", textAlign: "center" },
  content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 18 },
  
  // 保持上一步幫你做的置中放大版樣式
  avatarSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 10,
  },
  // 🌟 注意：原本的 avatarCircle 樣式我也完整保留，它現在可以同時應用在 View 和 Image 上
  avatarCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, // 置中且變圓的關鍵
    backgroundColor: "#e5e7eb", // 預設灰色
    overflow: 'hidden', // 確保圖片超出邊框的部分會被裁切成圓形
  },
  avatarLabel: { fontSize: 14, fontWeight: "800", color: "#6b7280" },

  row: { height: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowLabel: { fontSize: 16, fontWeight: "800", color: "#111827" },
  divider: { height: 1, backgroundColor: "#e5e7eb" },
  input: { height: 52, borderRadius: 10, backgroundColor: "#e5e7eb", paddingHorizontal: 14, fontSize: 16, color: "#111827", marginBottom: 10 },
  hint: { marginTop: -6, marginBottom: 10, fontSize: 14, fontWeight: "800", color: "#111827" },
  hintMuted: { marginTop: -6, marginBottom: 10, fontSize: 14, fontWeight: "800", color: "#6b7280" },
  oxWrap: { flexDirection: "row", gap: 10, alignItems: "center" },
  oxBtn: { width: 44, height: 36, borderRadius: 10, backgroundColor: "#e5e7eb", alignItems: "center", justifyContent: "center" },
  oxBtnActive: { backgroundColor: "#111827" },
  oxText: { fontSize: 18, fontWeight: "900", color: "#111827" },
  oxTextActive: { color: "#fff" },
});