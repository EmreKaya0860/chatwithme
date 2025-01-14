import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { auth } from "../services/authentication";
import {
  getFriends,
  getUserDataWithEmail,
  removeFriend,
  sendFriendRequest,
} from "../services/firestore";

import LoadingIndicator from "../Components/LoadingIndicator";

import AntDesign from "@expo/vector-icons/AntDesign";

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const FriendsContainer = ({ friend, setIsLoading, fetchFriends }) => {
  const [removeFriendModalVisibility, setRemoveFriendModalVisibility] =
    useState(false);
  if (!friend) return null;
  const profileImage = friend.profileImage || "https://via.placeholder.com/150";

  const handleRemoveFriend = async (friendEmail, status) => {
    setIsLoading(true);
    const friend = await getUserDataWithEmail(friendEmail);
    const friendDocId = friend[1].docId;
    const currentUser = await getUserDataWithEmail(auth.currentUser.email);
    const currentUserEmail = auth.currentUser.email;
    const receiverDocId = currentUser[1].docId;
    const result = await removeFriend(
      friendEmail,
      friendDocId,
      currentUserEmail,
      receiverDocId,
      status
    );
    console.log(result);
    setRemoveFriendModalVisibility(false);
    fetchFriends();
    setIsLoading(false);
    Alert.alert("Sonuç", result.message);
  };

  return (
    <View style={styles.friendUserContainer}>
      <Image source={{ uri: profileImage }} style={styles.friendUserImage} />
      <Text style={styles.friendUserName}>
        {friend.displayName || "Bilinmeyen Kullanıcı"}
      </Text>
      <TouchableOpacity
        onPress={() =>
          setRemoveFriendModalVisibility(!removeFriendModalVisibility)
        }
      >
        <AntDesign name="delete" size={24} color="#bb86fc" />
      </TouchableOpacity>
      <Modal
        transparent={true}
        animationType="slide"
        visible={removeFriendModalVisibility}
      >
        <View style={styles.removeFriendModalContainer}>
          <View style={styles.removeFriendModalContent}>
            <Text style={styles.modalText}>
              Arkadaşınızı silmek istediğinize emin misiniz?
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handleRemoveFriend(friend.email, true)}
            >
              <Text style={styles.buttonText}>Evet</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handleRemoveFriend(friend.email, false)}
            >
              <Text style={styles.buttonText}>Hayır</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const FriendsScreen = ({ navigation }) => {
  const [modalVisibility, setModalVisibility] = useState(false);
  const [addFriendEmail, setAddFriendEmail] = useState(null);
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [friends, setFriends] = useState([]);

  const fetchFriends = async () => {
    const friendsData = await getFriends();
    setFriends(friendsData);
    setIsLoading(false);
  };

  useEffect(() => {
    setIsLoading(true);
    fetchFriends();
    navigation.addListener("focus", () => {
      fetchFriends();
    });
    console.log(friends);
  }, []);

  const handleAddFriend = async () => {
    if (validateEmail(addFriendEmail)) {
      setIsLoading(true);
      const receiver = await getUserDataWithEmail(addFriendEmail);

      if (receiver.length > 0) {
        const receiverDocId = receiver[1].docId;
        const sender = await getUserDataWithEmail(auth.currentUser.email);
        const senderDocId = sender[1].docId;
        const result = await sendFriendRequest(
          senderDocId,
          receiverDocId,
          sender[0],
          receiver[0]
        );
        Alert.alert("Sonuç", result.message);
        setModalVisibility(false);
        setEmailError("");
      } else {
        setEmailError("Kullanıcı bulunamadı.");
      }
    } else {
      setEmailError("Geçerli bir e-posta adresi giriniz.");
    }
    setIsLoading(false);
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text>Hiç arkadaşınız yok :/</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Arkadaşlar</Text>
      <FlatList
        data={friends}
        renderItem={({ item }) => (
          <FriendsContainer
            friend={item}
            setIsLoading={setIsLoading}
            fetchFriends={fetchFriends}
          />
        )}
        keyExtractor={(item, index) => index.toString()}
        ListEmptyComponent={renderEmptyComponent}
        scrollEnabled={true}
        overScrollMode="always"
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisibility(!modalVisibility)}
      >
        <Text style={styles.addButtonText}>Arkadaş Ekle</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("FriendRequestsScreen")}
      >
        <Text style={styles.addButtonText}>Arkadaşlık İstekleri</Text>
      </TouchableOpacity>
      <Modal
        visible={modalVisibility}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisibility(false)}
      >
        <View style={styles.addFriendModalContainer}>
          <View style={styles.addFriendModalContent}>
            <Text style={styles.modalTitle}>Arkadaş Ekle</Text>
            <Text style={styles.modalSubtitle}>
              Arkadaş eklemek istediğiniz kişinin e-posta adresini giriniz:
            </Text>
            <TextInput
              style={styles.inputArea}
              placeholder="E-posta"
              placeholderTextColor="#aaa"
              keyboardType="email-address"
              onChangeText={(email) => {
                setAddFriendEmail(email);
                setEmailError("");
              }}
            />
            <Text style={styles.emailError}>{emailError}</Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleAddFriend}
              >
                <Text style={styles.buttonText}>Ekle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setModalVisibility(false)}
              >
                <Text style={styles.buttonText}>İptal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <LoadingIndicator visible={isLoading} />
    </SafeAreaView>
  );
};

export default FriendsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2E2E2E",
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
  },
  friendUserContainer: {
    width: "100%",
    padding: 15,
    backgroundColor: "#3D3D3D",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
    borderRadius: 10,
  },
  friendUserImage: {
    width: 50,
    height: 50,
    borderRadius: 50,
    marginRight: 15,
  },
  friendUserName: {
    color: "#fff",
    fontSize: 16,
    flex: 1,
  },
  addButton: {
    backgroundColor: "#bb86fc",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginVertical: 10,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  addFriendModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  addFriendModalContent: {
    width: 300,
    padding: 10,
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    marginBottom: 10,
  },
  modalSubtitle: {
    color: "#aaa",
    textAlign: "center",
    marginBottom: 20,
  },
  inputArea: {
    width: "100%",
    backgroundColor: "#3D3D3D",
    borderRadius: 5,
    padding: 10,
    color: "#fff",
    marginBottom: 10,
  },
  emailError: {
    color: "red",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 100,
    gap: 80,
    display: "flex",
    alignSelf: "flex-start",
  },
  modalButton: {
    backgroundColor: "#bb86fc",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  friendUserContainer: {
    width: "100%",
    padding: 15,
    backgroundColor: "#3D3D3D",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
    borderRadius: 10,
  },
  friendUserImage: {
    width: 50,
    height: 50,
    borderRadius: 50,
    marginRight: 15,
  },
  friendUserName: {
    color: "#fff",
    fontSize: 16,
    flex: 1,
  },
  removeFriendModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  removeFriendModalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    alignItems: "center",
  },
  modalText: {
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: "#bb86fc",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});

// addFriendModalContainer: {
//   flex: 1,
//   justifyContent: "center",
//   alignItems: "center",
//   backgroundColor: "rgba(0,0,0,0.5)",
// },
// addFriendModalContent: {
//   width: 300,
//   padding: 20,
//   backgroundColor: "white",
//   borderRadius: 10,
//   elevation: 5,
// },
// inputArea: {
//   borderWidth: 1,
//   borderColor: "gray",
//   width: 200,
//   backgroundColor: "white",
//   marginTop: 10,
//   padding: 5,
//   color: "black",
// },
// emailError: {
//   color: "red",
// },
// friendUserContainer: {
//   width: "100%",
//   height: 50,
//   backgroundColor: "yellow",
//   padding: 10,
//   display: "flex",
//   flexDirection: "row",
//   alignItems: "center",
//   gap: 50,
//   marginVertical: 5,
// },
// friendUserImage: {
//   width: 50,
//   height: 50,
//   borderRadius: 50,
// },
// emptyContainer: {
//   flex: 1,
//   justifyContent: "center",
//   alignItems: "center",
// },
// removeFriendModalContainer: {
//   flex: 1,
//   justifyContent: "center",
//   alignItems: "center",
//   backgroundColor: "rgba(0,0,0,0.2)",
// },
// removeFriendModalContent: {
//   width: 300,
//   padding: 20,
//   backgroundColor: "white",
//   borderRadius: 10,
//   elevation: 5,
// },
