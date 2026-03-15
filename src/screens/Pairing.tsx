import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Server, ArrowRight } from 'lucide-react';
import { addConnection } from '../services/connectionStore';
import { getUserId } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';

export default function Pairing({ onBack, onPaired }: { onBack: () => void; onPaired: (connId: string) => void }) {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [token, setToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [senderId, setSenderId] = useState('');
  const [error, setError] = useState('');

  const handlePair = () => {
    const trimmedName = name.trim();
    const trimmedUrl = serverUrl.trim();

    const trimmedDisplayName = displayName.trim();

    if (!trimmedName) { setError('Connection name is required.'); return; }
    if (!trimmedDisplayName) { setError('Display name is required.'); return; }
    if (!trimmedUrl) { setError('WebSocket URL is required.'); return; }
    if (!/^wss?:\/\/.+/.test(trimmedUrl)) { setError('URL must start with ws:// or wss://'); return; }

    const conn = addConnection(trimmedName, trimmedUrl, trimmedDisplayName, token.trim() || undefined, chatId.trim() || undefined, senderId.trim() || undefined);
    onPaired(conn.id);
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFB]">
      {/* Header */}
      <div className="px-4 py-4 sticky top-0 bg-[#F8FAFB]/80 backdrop-blur-xl z-20 flex items-center justify-between">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="p-2 -ml-2 text-[#2D3436]">
          <ChevronLeft size={28} />
        </motion.button>
        <h2 className="font-semibold text-[17px]">Connect Server</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 pb-32 space-y-8">
        {/* Hero */}
        <div className="flex flex-col items-center text-center pt-4 pb-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 bg-gradient-to-br from-[#67B88B] to-[#4a9a70] rounded-[20px] flex items-center justify-center shadow-lg shadow-[#67B88B]/30 mb-5"
          >
            <Server size={28} className="text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold mb-2">Connect Workspace</h1>
          <p className="text-[#2D3436]/50 text-[15px] leading-relaxed max-w-[280px]">
            Set your Generic Channel endpoint to connect to an OpenClaw workspace.
          </p>
        </div>

        {/* Form */}
        <Card className="p-5 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[#2D3436]/70 mb-1.5">Connection Name</label>
            <Input
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="e.g. My Dev Server"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#2D3436]/70 mb-1.5">Display Name</label>
            <Input
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); setError(''); }}
              placeholder="e.g. Alex Developer"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#2D3436]/70 mb-1.5">Generic Channel WS URL</label>
            <Input
              value={serverUrl}
              onChange={(e) => { setServerUrl(e.target.value); setError(''); }}
              placeholder="ws://host:18080/ws"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#2D3436]/70 mb-1.5">Auth Token <span className="text-[#2D3436]/30 font-normal">(optional)</span></label>
            <Input
              value={token}
              onChange={(e) => { setToken(e.target.value); setError(''); }}
              placeholder="gc_user_xxxxxxxxx"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#2D3436]/70 mb-1.5">Chat ID <span className="text-[#2D3436]/30 font-normal">(token auth: must match token binding)</span></label>
            <Input
              value={chatId}
              onChange={(e) => { setChatId(e.target.value); setError(''); }}
              placeholder="gc-test-main"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#2D3436]/70 mb-1.5">Sender ID <span className="text-[#2D3436]/30 font-normal">(token auth: must match token binding)</span></label>
            <Input
              value={senderId}
              onChange={(e) => { setSenderId(e.target.value); setError(''); }}
              placeholder="gc-test-main"
            />
          </div>
        </Card>

        {/* Note */}
        <div className="bg-amber-50 border border-amber-200/60 rounded-[16px] p-4">
          <p className="text-[13px] font-semibold text-amber-700 mb-1">Current test environment</p>
          <p className="text-[12px] text-amber-600/80 leading-relaxed">
            Use your own endpoint here. For production, switch to a valid <code className="bg-amber-100 px-1 rounded">wss://</code> domain.
          </p>
        </div>

        {/* Error */}
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-[13px] text-center">
            {error}
          </motion.p>
        )}

        {/* Action */}
        <Button size="lg" className="w-full" onClick={handlePair}>
          Pair and Continue
          <ArrowRight size={20} />
        </Button>
      </div>
    </div>
  );
}
