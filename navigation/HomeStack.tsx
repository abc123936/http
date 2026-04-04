import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ScreenGroupList from "../screens/ScreenGroupList";
import ScreenMemberList from "../screens/ScreenMemberList";
import ScreenReviewMembers from "../screens/ScreenReviewMembers";

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator 
      // 關鍵在這一行：把 HomeStack 裡面所有頁面的預設標頭關掉
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="GroupList" component={ScreenGroupList} />
      <Stack.Screen name="MemberList" component={ScreenMemberList} />
      <Stack.Screen name="ReviewMembers" component={ScreenReviewMembers} />
    </Stack.Navigator>
  );
}