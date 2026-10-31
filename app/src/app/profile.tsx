import { router } from 'expo-router';
import { ProfileGate } from '../components/ProfileGate';

/** Change name / avatar. */
export default function ProfileRoute() {
  return (
    <ProfileGate edit>
      {() => {
        setTimeout(() => (router.canGoBack() ? router.back() : router.replace('/play')), 0);
        return null;
      }}
    </ProfileGate>
  );
}
