import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { formatPrice, shopifyImageUrl, type CartLine, ensureShopifyCheckoutUrl } from "@/lib/shopify";
import { useLanguage } from "@/lib/language";

const SPACER_PRICES: Record<string, number> = {
  "15 mm": 159.99, "16 mm": 159.99, "17 mm": 159.99, "18 mm": 159.99, "19 mm": 159.99,
  "20 mm": 179.99, "21 mm": 179.99, "22 mm": 179.99, "23 mm": 179.99, "24 mm": 179.99,
  "25 mm": 181.99, "26 mm": 181.99, "27 mm": 181.99, "28 mm": 181.99, "29 mm": 181.99,
  "30 mm": 183.99, "31 mm": 183.99, "32 mm": 183.99, "33 mm": 183.99, "34 mm": 183.99,
  "35 mm": 189.99, "36 mm": 189.99, "37 mm": 189.99, "38 mm": 189.99, "39 mm": 189.99,
  "40 mm": 193.99, "41 mm": 193.99, "42 mm": 193.99, "43 mm": 193.99, "44 mm": 193.99,
  "45 mm": 204.99, "46 mm": 204.99, "47 mm": 204.99, "48 mm": 204.99, "49 mm": 204.99,
  "50 mm": 207.99,
};

function getSpacerPrice(line: CartLine): number | null {
  const title = line.merchandise.product.title?.toLowerCase() || "";
  if (!/spacer|adapter/i.test(title)) return null;
  const thicknessAttr = line.attributes?.find(a => a.key === "Spacer Thickness");
  if (thicknessAttr?.value && SPACER_PRICES[thicknessAttr.value]) {
    return SPACER_PRICES[thicknessAttr.value];
  }
  return null;
}

/* Exported separately so Navbar can lazy-load just the content into its own Sheet */
export function CartDrawerContent() {
  const { cart, isLoading, updateItem, removeItem, isUpdating } = useCart();
  const { t } = useLanguage();

  const lines: CartLine[] = cart?.lines?.edges?.map((e: { node: CartLine }) => e.node) || [];

  const spacerAdjustment = lines.reduce((acc, line) => {
    const realPrice = getSpacerPrice(line);
    if (realPrice !== null) {
      const shopifyPrice = parseFloat(line.cost.totalAmount.amount);
      return acc + (realPrice * line.quantity - shopifyPrice);
    }
    // BC Racing (and other dropship) products have $0 in Shopify but a real merchandise.price
    const shopifyTotal = parseFloat(line.cost.totalAmount.amount);
    if (shopifyTotal === 0) {
      const unitPrice = parseFloat(line.merchandise.price.amount);
      if (unitPrice > 0) {
        return acc + (unitPrice * line.quantity);
      }
    }
    return acc;
  }, 0);

  return (
    <>
      <SheetHeader className="p-6 pb-0">
        <SheetTitle className="font-display text-white text-2xl uppercase">{t('cart.yourCart')}</SheetTitle>
      </SheetHeader>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : lines.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <ShoppingBag className="h-16 w-16 text-white/10" />
          <p className="text-muted-foreground font-tech uppercase tracking-wider text-sm" data-testid="text-empty-cart">{t('cart.empty')}</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {lines.map((line) => (
              <div key={line.id} className="flex gap-4" data-testid={`cart-item-${line.id}`}>
                <div className="h-20 w-20 shrink-0 bg-white/5 border border-white/10 overflow-hidden">
                  {line.merchandise.image && (
                    <img
                      src={shopifyImageUrl(line.merchandise.image.url, 150)}
                      alt={line.merchandise.image.altText || ""}
                      className="h-full w-full object-cover"
                      width={150}
                      height={150}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white text-sm font-medium truncate">{line.merchandise.product.title}</h4>
                  {line.merchandise.title !== "Default Title" && (
                    <p className="text-muted-foreground text-xs">{line.merchandise.title}</p>
                  )}
                  {line.attributes?.filter(a => a.key && a.value).map((attr, i) => (
                    <p key={i} className="text-primary/70 text-[10px] font-tech uppercase tracking-wider">{attr.key}: {attr.value}</p>
                  ))}
                  <p className="text-primary text-sm font-tech mt-1">
                    {(() => {
                      const spacerUnit = getSpacerPrice(line);
                      if (spacerUnit !== null) {
                        return `€${(spacerUnit * line.quantity).toFixed(2)}`;
                      }
                      const total = parseFloat(line.cost.totalAmount.amount);
                      if (total === 0) {
                        const unitPrice = parseFloat(line.merchandise.price.amount);
                        if (unitPrice > 0) {
                          return formatPrice({ amount: String(unitPrice * line.quantity), currencyCode: line.merchandise.price.currencyCode });
                        }
                      }
                      return formatPrice(line.cost.totalAmount);
                    })()}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateItem(line.id, Math.max(0, line.quantity - 1))}
                      disabled={isUpdating}
                      className="h-7 w-7 flex items-center justify-center border border-white/20 text-white hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                      data-testid={`button-decrease-${line.id}`}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-white text-sm font-tech w-6 text-center" data-testid={`text-quantity-${line.id}`}>{line.quantity}</span>
                    <button
                      onClick={() => updateItem(line.id, line.quantity + 1)}
                      disabled={isUpdating}
                      className="h-7 w-7 flex items-center justify-center border border-white/20 text-white hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                      data-testid={`button-increase-${line.id}`}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeItem(line.id)}
                      disabled={isUpdating}
                      className="ml-auto text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                      data-testid={`button-remove-${line.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-tech uppercase tracking-wider text-sm">{t('cart.subtotal')}</span>
              <span className="text-white font-tech text-lg" data-testid="text-cart-subtotal">
                {cart?.cost?.subtotalAmount
                  ? Math.abs(spacerAdjustment) > 0.001
                    ? `€${(parseFloat(cart.cost.subtotalAmount.amount) + spacerAdjustment).toFixed(2)}`
                    : formatPrice(cart.cost.subtotalAmount)
                  : "—"}
              </span>
            </div>
            {Math.abs(spacerAdjustment) > 0.001 && (
              <p className="text-[10px] text-primary/60 font-tech uppercase tracking-wider">
                {t('cart.priceConfirmNote') || 'Final price will be confirmed at checkout via invoice.'}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{t('cart.shippingTaxes')}</p>
            <Button
              className="w-full h-14 bg-primary text-primary-foreground hover:bg-white hover:text-black font-tech uppercase tracking-widest text-sm"
              disabled={!cart?.checkoutUrl}
              onClick={async () => {
                if (cart?.checkoutUrl) {
                  const safeUrl = await ensureShopifyCheckoutUrl(cart.checkoutUrl);
                  window.location.href = safeUrl;
                }
              }}
              data-testid="button-checkout"
            >
              {t('cart.checkout')}
            </Button>
          </div>
        </>
      )}
    </>
  );
}

/* Legacy full Sheet wrapper kept for backward-compat (used by App.tsx floating button) */
export function CartDrawer() {
  const { cart, isLoading } = useCart();
  const totalQuantity = cart?.totalQuantity || 0;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          aria-label="Shopping cart"
          className="group relative flex items-center justify-center w-14 h-14 bg-primary text-black shadow-[0_4px_20px_rgba(233,211,85,0.4)] hover:shadow-[0_4px_28px_rgba(233,211,85,0.6)] hover:scale-110 active:scale-95 transition-all duration-200"
          data-testid="button-cart"
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <ShoppingBag className="w-6 h-6 group-hover:rotate-[-8deg] transition-transform duration-200" />
          )}
          {totalQuantity > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] bg-white text-black text-[11px] font-bold flex items-center justify-center px-1 shadow-md animate-in zoom-in duration-200"
              data-testid="text-cart-count"
            >
              {totalQuantity}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[420px] bg-background border-l border-white/10 flex flex-col p-0">
        <CartDrawerContent />
      </SheetContent>
    </Sheet>
  );
}
