import { router } from "expo-router";

const goToNewMovementScreen = () => {
  router.push("/newTransaction");
};

const goToHomeScreen = () => {
  router.push("/");
}

export {
  goToHomeScreen,
  goToNewMovementScreen
}
