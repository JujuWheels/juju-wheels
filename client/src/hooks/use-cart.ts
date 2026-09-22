import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOrCreateCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearStoredCart,
  type Cart,
} from "@/lib/shopify";
import { useToast } from "@/hooks/use-toast";

export function useCart() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: cart, isLoading } = useQuery<Cart | null>({
    queryKey: ["cart"],
    queryFn: async () => {
      try {
        const existing = localStorage.getItem("juju-cart-id");
        if (!existing) return null;
        return await getOrCreateCart();
      } catch {
        clearStoredCart();
        return null;
      }
    },
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  const addMutation = useMutation({
    mutationFn: ({ variantId, quantity, attributes, extraLines }: { variantId: string; quantity?: number; attributes?: { key: string; value: string }[]; extraLines?: { merchandiseId: string; quantity: number; attributes?: { key: string; value: string }[] }[] }) =>
      addItemToCart(variantId, quantity, attributes, extraLines),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(["cart"], updatedCart);
      toast({
        title: "Added to cart",
        description: "Item has been added to your cart.",
        className: "bg-primary text-primary-foreground border-none font-tech uppercase",
      });
    },
    onError: (err: Error) => {
      if (err.message?.includes("expired")) {
        queryClient.invalidateQueries({ queryKey: ["cart"] });
      }
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ lineId, quantity }: { lineId: string; quantity: number }) => {
      if (quantity === 0) return removeCartItem(lineId);
      return updateCartItem(lineId, quantity);
    },
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(["cart"], updatedCart);
    },
    onError: (err: Error) => {
      if (err.message?.includes("expired")) {
        clearStoredCart();
        queryClient.invalidateQueries({ queryKey: ["cart"] });
      }
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (lineId: string) => removeCartItem(lineId),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(["cart"], updatedCart);
    },
    onError: (err: Error) => {
      if (err.message?.includes("expired")) {
        clearStoredCart();
        queryClient.invalidateQueries({ queryKey: ["cart"] });
      }
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return {
    cart,
    isLoading,
    isUpdating: addMutation.isPending || updateMutation.isPending || removeMutation.isPending,
    addItem: (variantId: string, quantity?: number, attributes?: { key: string; value: string }[], extraLines?: { merchandiseId: string; quantity: number; attributes?: { key: string; value: string }[] }[]) =>
      addMutation.mutate({ variantId, quantity, attributes, extraLines }),
    updateItem: (lineId: string, quantity: number) =>
      updateMutation.mutate({ lineId, quantity }),
    removeItem: (lineId: string) => removeMutation.mutate(lineId),
  };
}
