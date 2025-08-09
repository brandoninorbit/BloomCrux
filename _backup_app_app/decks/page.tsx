
"use client"
import { Button } from "@/components/ui/button";
import { Folder as FolderIcon, Search, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useAuth } from '@/app/Providers/AuthProvider';

const initialFolders = [
  {
    id: 'folder1',
    name: 'Science',
    deckCount: 0,
    color: "blue",
    decks: []
  },
  {
    id: 'folder2',
    name: 'Languages',
    deckCount: 0,
    color: "green",
    decks: []
  },
];

const DeckCard = ({ subject, title, unlocked }: { subject: string, title: string, unlocked: boolean }) => (
    <div className="group perspective-1000">
        <div className="relative w-full aspect-[3/4] bg-card rounded-xl shadow-md transition-all duration-500 group-hover:shadow-xl group-hover:-translate-y-2 transform-style-3d group-hover:rotate-y-3">
            {unlocked ? (
                 <>
                    <div className="absolute inset-0 bg-muted/50 rounded-xl flex items-center justify-center">
                        <p className="text-lg font-medium text-muted-foreground">{subject}</p>
                    </div>
                    <div className="absolute bottom-4 left-4 text-sm font-medium text-card-foreground">{title}</div>
                 </>
            ) : (
                <>
                    <div className="absolute inset-0 bg-muted/50 rounded-xl flex items-center justify-center">
                        <div className="absolute top-2 right-2 p-1.5 bg-yellow-500/20 text-yellow-500 rounded-full">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path clipRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" fillRule="evenodd"></path></svg>
                        </div>
                        <p className="text-lg font-medium text-muted-foreground">{subject}</p>
                    </div>
                    <div className="absolute bottom-4 left-4 text-sm font-medium text-card-foreground">{title}</div>
                </>
            )}
        </div>
    </div>
);


const FolderCard = ({ name, deckCount, color}: {name: string, deckCount: number, color: string}) => {
    const colorClasses = {
        blue: "bg-blue-100 text-blue-500",
        green: "bg-green-100 text-green-500",
        yellow: "bg-yellow-100 text-yellow-500",
        gray: "bg-gray-100 text-gray-500"
    }[color] || "bg-gray-100 text-gray-500";

    return (
        <div className="flex-grow flex items-center gap-5 text-left p-0">
            <div className={`w-12 h-12 flex-shrink-0 rounded-lg ${colorClasses} flex items-center justify-center`}>
                <FolderIcon className="h-6 w-6" />
            </div>
            <div>
                <p className="font-semibold text-card-foreground">{name}</p>
                <p className="text-sm text-muted-foreground">{deckCount} sets</p>
            </div>
        </div>
    )
}

export default function DecksPage() {
  const { user } = useAuth();
  const [folders, setFolders] = useState(initialFolders);
  const [decks, setDecks] = useState([]);

  const handleAddNewFolder = () => {
    const newFolderName = prompt("Enter new folder name:");
    if (newFolderName) {
        const newFolder = {
          id: `folder${folders.length + 1}`,
          name: newFolderName,
          deckCount: 0,
          color: "gray",
          decks: []
        };
        setFolders(prevFolders => [...prevFolders, newFolder]);
    }
  };

  const updateFolderName = (folderId: string, newName: string) => {
    setFolders(folders.map(f => f.id === folderId ? { ...f, name: newName } : f));
  };

  const deleteFolder = (folderId: string) => {
    setFolders(folders.filter(f => f.id !== folderId));
  };

  const handleEdit = (e: React.MouseEvent, folder: typeof folders[0]) => {
      e.stopPropagation();
      const newName = prompt("Enter new folder name:", folder.name);
      if (newName) {
          updateFolderName(folder.id, newName);
      }
  };

  const handleDelete = (e: React.MouseEvent, folder: typeof folders[0]) => {
      e.stopPropagation();
      if (confirm(`Are you sure you want to delete the folder "${folder.name}"?`)) {
          deleteFolder(folder.id);
      }
  };


  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.displayName || "Learner"}</h2>
            <p className="text-muted-foreground mb-6">Let's get learning.</p>

            <div className="relative mb-2">
                 <Button variant="outline" disabled className="w-full h-12 justify-start text-muted-foreground font-normal text-left pl-10 shadow-sm">
                    Search your decks... (Future Feature)
                </Button>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <Search className="h-5 w-5" />
                </div>
            </div>
            <p className="text-xs text-muted-foreground italic px-2">Tip: Consistent review is the key to long-term memory.</p>

            <div className="mt-12">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-semibold">Recent Decks</h3>
                </div>
                {decks.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {/* The user wants this empty for now, will be populated with dynamic data later */}
                    </div>
                ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl">
                        <p className="text-muted-foreground">No recent decks. Start studying to see them here!</p>
                    </div>
                )}
            </div>

            <div className="mt-12">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-semibold">Folders</h3>
                    <div className="flex items-center gap-4">
                        <Button onClick={handleAddNewFolder}>New Folder</Button>
                    </div>
                </div>
                 <Accordion type="multiple" className="space-y-4">
                   {folders.map(folder => (
                       <AccordionItem value={folder.id} key={folder.id} className="border-none group">
                           <div className="bg-card rounded-lg shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center justify-between p-4 w-full">
                               <AccordionTrigger className="w-full p-0 hover:no-underline">
                                 <FolderCard name={folder.name} deckCount={folder.deckCount} color={folder.color} />
                               </AccordionTrigger>
                               <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <Button variant="ghost" size="icon" onClick={(e) => handleEdit(e, folder)}>
                                       <Pencil className="h-4 w-4" />
                                   </Button>
                                   <Button variant="ghost" size="icon" onClick={(e) => handleDelete(e, folder)}>
                                       <Trash2 className="h-4 w-4 text-destructive" />
                                   </Button>
                               </div>
                           </div>
                         <AccordionContent className="bg-muted/50 rounded-b-lg p-4 -mt-2">
                           {folder.decks.length > 0 ? (
                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                               {folder.decks.map((deck: any) => (
                                   <DeckCard key={deck.id} {...deck} />
                               ))}
                             </div>
                           ) : (
                             <div className="text-center text-muted-foreground py-8">
                               <p>This folder is empty.</p>
                               <Button variant="link" className="mt-2">Add a new set</Button>
                             </div>
                           )}
                         </AccordionContent>
                       </AccordionItem>
                   ))}
                </Accordion>
            </div>
        </div>
    </div>
  );
}
