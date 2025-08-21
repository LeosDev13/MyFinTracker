import { router } from 'expo-router';

const goToNewMovementScreen = () => {
  router.push('/newTransaction');
};

const goToHomeScreen = () => {
  router.push('/');
};

const goToSettingsScreen = () => {
  router.push('/settings');
};

export { goToHomeScreen, goToNewMovementScreen, goToSettingsScreen };
