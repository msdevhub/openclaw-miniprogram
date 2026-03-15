import { Search as SearchIcon, Command, FileText, MessageSquare } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export default function Search() {
  return (
    <div className="flex flex-col h-full pb-32 px-6 pt-12">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Search</h1>
      
      <div className="relative mb-8">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2D3436]/40" size={20} />
        <Input
          autoFocus
          placeholder="Ask anything or search..."
          className="pl-12 py-4 rounded-[24px] text-[16px] focus:ring-4 focus:ring-[#67B88B]/10 bg-white"
        />
      </div>

      <div className="space-y-8">
        <section>
          <h3 className="text-sm font-semibold text-[#2D3436]/50 mb-3 uppercase tracking-wider">Quick Filters</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="rounded-full">
              <MessageSquare size={14} className="text-[#67B88B]" /> Chats
            </Button>
            <Button variant="outline" size="sm" className="rounded-full">
              <FileText size={14} className="text-blue-500" /> Files
            </Button>
            <Button variant="outline" size="sm" className="rounded-full">
              <Command size={14} className="text-purple-500" /> Commands
            </Button>
          </div>
        </section>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <SearchIcon size={40} className="text-[#2D3436]/10 mb-4" />
          <p className="text-[#2D3436]/30 text-[15px]">Search across your conversations and commands</p>
        </div>
      </div>
    </div>
  );
}
