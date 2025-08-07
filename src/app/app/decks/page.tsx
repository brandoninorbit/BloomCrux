"use client"
import { DeckCard } from "@/components/dashboard/deck-card";
import { Input } from "@/components/ui/input";
import { Folder, FolderPlus, PlusCircle, Search } from "lucide-react";

const placeholderFolders = [
  {
    id: 'folder1',
    name: 'New Folder 1',
    decks: [
      { id: '1', title: 'Spanish Vocabulary', cardCount: 50, progress: 75, unlocked: true },
    ]
  },
  {
    id: 'folder2',
    name: 'New Folder 2',
    decks: [
       { id: '2', title: 'React Hooks', cardCount: 25, progress: 40, unlocked: true },
    ]
  }
];

const AddNewSetCard = () => (
  <div className="flex items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors h-full min-h-[220px]">
    <div className="text-center text-muted-foreground">
      <PlusCircle className="mx-auto h-10 w-10 mb-2" />
      <p className="mt-2 font-medium">Add New Set</p>
    </div>
  </div>
);

const AddNewFolderCard = () => (
    <div className="flex items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors mb-12">
        <div className="text-center text-muted-foreground">
            <FolderPlus className="mx-auto h-10 w-10 mb-2" />
            <p className="mt-2 font-medium">Add New Folder</p>
        </div>
    </div>
);


export default function DecksPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Decks</h1>
        <p className="text-muted-foreground">Organize your knowledge into folders and decks.</p>
      </div>

       <div className="mb-10 max-w-lg mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search decks and folders..." className="pl-10 h-11" />
        </div>
      </div>
      
      <AddNewFolderCard />

      {placeholderFolders.map(folder => (
        <section key={folder.id} className="mb-12">
            <div className="flex items-center gap-3 mb-6">
                <Folder className="w-8 h-8 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight">{folder.name}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {folder.decks.map(deck => (
                    <DeckCard key={deck.id} {...deck} />
                ))}
                <AddNewSetCard />
            </div>
        </section>
      ))}

    </div>
  );
}
