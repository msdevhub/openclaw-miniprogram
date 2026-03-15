import { useState, useEffect } from 'react';
import { Activity, Server, Wifi, WifiOff, Users, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { getActiveConnection } from '../services/connectionStore';
import * as channel from '../services/clawChannel';
import { getUserId } from '../App';

type ChannelStatus = {
  configured: boolean;
  enabled: boolean;
  running: boolean;
  mode: string;
  port: number;
  path: string;
  currentChatId: string;
  currentChatConnectionCount: number;
  connectedChatCount: number;
  connectedSocketCount: number;
};

export default function Dashboard() {
  const [status, setStatus] = useState<ChannelStatus | null>(null);
  const [wsStatus, setWsStatus] = useState(channel.getStatus());
  const activeConn = getActiveConnection();

  useEffect(() => {
    if (!activeConn) return;

    const chatId = activeConn.chatId || `openclaw-web-dashboard-${activeConn.id}`;
    channel.connect({
      chatId,
      senderId: activeConn.senderId || getUserId(),
      senderName: activeConn.displayName,
      serverUrl: activeConn.serverUrl,
      token: activeConn.token,
    });

    const unsubMsg = channel.onMessage((packet) => {
      if (packet.type === 'connection.open') {
        // Request channel status
        try {
          channel.sendRaw({
            type: 'channel.status.get',
            data: { requestId: `status-${Date.now()}`, includeChats: false },
          });
        } catch { /* ignore */ }
      }
      if (packet.type === 'channel.status') {
        setStatus(packet.data as unknown as ChannelStatus);
      }
    });

    const unsubStatus = channel.onStatus((s) => setWsStatus(s));

    // Refresh every 10s
    const interval = setInterval(() => {
      try {
        channel.sendRaw({
          type: 'channel.status.get',
          data: { requestId: `status-${Date.now()}`, includeChats: false },
        });
      } catch { /* ignore */ }
    }, 10000);

    return () => {
      unsubMsg();
      unsubStatus();
      clearInterval(interval);
    };
  }, [activeConn?.id]);

  return (
    <div className="flex flex-col h-full pb-32 px-6 pt-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
        {activeConn && (
          <Badge variant={wsStatus === 'connected' ? 'success' : 'warning'}>
            {wsStatus === 'connected' ? 'Live' : 'Offline'}
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {/* Channel Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server size={18} className="text-[#67B88B]" /> Channel Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status ? (
              <div className="grid grid-cols-2 gap-3">
                <StatusItem
                  icon={<Wifi size={16} className="text-[#67B88B]" />}
                  label="Mode"
                  value={status.mode}
                />
                <StatusItem
                  icon={<Activity size={16} className="text-[#67B88B]" />}
                  label="Running"
                  value={status.running ? 'Yes' : 'No'}
                />
                <StatusItem
                  icon={<Users size={16} className="text-[#5B8DEF]" />}
                  label="Active Chats"
                  value={String(status.connectedChatCount)}
                />
                <StatusItem
                  icon={<MessageSquare size={16} className="text-[#5B8DEF]" />}
                  label="Connections"
                  value={String(status.connectedSocketCount)}
                />
              </div>
            ) : activeConn ? (
              <div className="flex items-center justify-center py-8 text-[#2D3436]/30 text-[14px]">
                {wsStatus === 'connected' ? 'Loading status…' : 'Connecting…'}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-[#2D3436]/30 text-[14px]">
                Connect a server to view status
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connection Info */}
        {activeConn && status && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity size={18} className="text-[#67B88B]" /> Connection Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-[14px]">
                <div className="flex justify-between">
                  <span className="text-[#2D3436]/50">Server</span>
                  <span className="font-medium truncate ml-4">{activeConn.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2D3436]/50">Port</span>
                  <span className="font-medium">{status.port}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2D3436]/50">Path</span>
                  <span className="font-medium">{status.path}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2D3436]/50">This Chat Connections</span>
                  <span className="font-medium">{status.currentChatConnectionCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatusItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[#F8FAFB] p-3 rounded-[16px] border border-[#EDF2F0]">
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-[12px] text-[#2D3436]/50">{label}</span></div>
      <div className="text-[16px] font-bold">{value}</div>
    </div>
  );
}
