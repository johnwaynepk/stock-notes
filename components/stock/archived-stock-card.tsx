"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArchiveRestore, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { unarchiveStock, hardDeleteStock } from "@/app/actions/stocks";
import { useToast } from "@/components/ui/use-toast";

interface ArchivedStockCardProps {
  userStock: {
    id: string;
    archivedAt: Date | null;
    stock: {
      symbol: string;
      exchange: string;
      name: string;
    };
  };
}

export function ArchivedStockCard({ userStock }: ArchivedStockCardProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const handleUnarchive = () => {
    startTransition(async () => {
      const result = await unarchiveStock(userStock.id);
      if (result.success) {
        toast({ title: `${userStock.stock.symbol} restored` });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await hardDeleteStock(userStock.id);
      if (result.success) {
        toast({ title: `${userStock.stock.symbol} permanently deleted` });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Card className="opacity-70 transition-opacity hover:opacity-100">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{userStock.stock.symbol}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {userStock.stock.exchange}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {userStock.stock.name}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Archived {userStock.archivedAt?.toLocaleDateString()}
        </p>
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleUnarchive}
            disabled={isPending}
            className="gap-1 text-xs"
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ArchiveRestore className="h-3 w-3" />
            )}
            Restore
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1 text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Permanently delete {userStock.stock.symbol}?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove this stock and all its notes.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Forever
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
