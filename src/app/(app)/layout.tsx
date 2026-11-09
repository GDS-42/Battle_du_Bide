import { BottomNav } from '@/components/BottomNav';
import { PushPrompt } from '@/components/PushPrompt';
import { vapidPublicKey } from '@/lib/push';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-[520px] pb-[92px]">
      {children}
      <PushPrompt vapidKey={vapidPublicKey()} />
      <BottomNav />
    </div>
  );
}
