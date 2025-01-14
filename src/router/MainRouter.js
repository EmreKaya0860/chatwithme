import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import FriendRequestsScreen from "../screens/FriendRequestsScreen";
import GroupLiveChatRoom from "../screens/GroupLiveChatRoom";
import LiveChatRoom from "../screens/LiveChatRoom";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeNavigator from "./HomeNavigator";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/authentication";

const Stack = createNativeStackNavigator();

const MainRouter = () => {
  const [isUserExist, setIsUserExist] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsUserExist(true);
      } else {
        setIsUserExist(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {isUserExist ? (
        <>
          <Stack.Screen name="HomeNavigator" component={HomeNavigator} />
          <Stack.Screen name="LiveChatRoom" component={LiveChatRoom} />
          <Stack.Screen
            name="GroupLiveChatRoom"
            component={GroupLiveChatRoom}
          />
          <Stack.Screen
            name="FriendRequestsScreen"
            component={FriendRequestsScreen}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default MainRouter;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
