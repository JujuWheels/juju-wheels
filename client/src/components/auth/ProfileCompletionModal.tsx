import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/lib/language";

interface ProfileCompletionModalProps {
  open: boolean;
  onComplete: () => void;
}

export function ProfileCompletionModal({ open, onComplete }: ProfileCompletionModalProps) {
  const { user, updateProfile, isUpdatingProfile, updateProfileError } = useAuth();
  const { t } = useLanguage();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [instagram, setInstagram] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!phone.trim() || phone.trim().length < 5) {
      setError(t('profile.phoneError'));
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError(t('profile.emailError'));
      return;
    }
    if (!address.trim() || address.trim().length < 3) {
      setError(t('profile.addressError'));
      return;
    }
    if (!city.trim() || city.trim().length < 2) {
      setError(t('profile.cityError'));
      return;
    }
    if (!postalCode.trim() || postalCode.trim().length < 3) {
      setError(t('profile.postalCodeError'));
      return;
    }
    if (!country.trim() || country.trim().length < 2) {
      setError(t('profile.countryError'));
      return;
    }

    try {
      await updateProfile({
        phone: phone.trim(),
        marketingEmail: email.trim(),
        address: address.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
        instagram: instagram.trim() || undefined,
      });
      onComplete();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="bg-black border border-white/10 sm:max-w-md [&>button]:hidden" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-white font-display uppercase tracking-wider text-xl">{t('profile.completeProfile')}</DialogTitle>
          <DialogDescription className="text-white/50 text-sm">
            {t('profile.completeProfileDesc')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-tech uppercase tracking-wider text-white/50 mb-1">
                {t('profile.phoneNumber')}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+31 6 1234 5678"
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-sm font-tech focus:outline-none focus:border-primary/50 transition-colors placeholder:text-white/20"
                data-testid="input-profile-phone"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[10px] font-tech uppercase tracking-wider text-white/50 mb-1">
                {t('profile.emailAddress')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-sm font-tech focus:outline-none focus:border-primary/50 transition-colors placeholder:text-white/20"
                data-testid="input-profile-email"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-tech uppercase tracking-wider text-white/50 mb-1">
              {t('profile.address')}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Kerkstraat 42"
              className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-sm font-tech focus:outline-none focus:border-primary/50 transition-colors placeholder:text-white/20"
              data-testid="input-profile-address"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-tech uppercase tracking-wider text-white/50 mb-1">
                {t('profile.city')}
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Amsterdam"
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-sm font-tech focus:outline-none focus:border-primary/50 transition-colors placeholder:text-white/20"
                data-testid="input-profile-city"
              />
            </div>
            <div>
              <label className="block text-[10px] font-tech uppercase tracking-wider text-white/50 mb-1">
                {t('profile.postalCode')}
              </label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="1012 AB"
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-sm font-tech focus:outline-none focus:border-primary/50 transition-colors placeholder:text-white/20"
                data-testid="input-profile-postal-code"
              />
            </div>
            <div>
              <label className="block text-[10px] font-tech uppercase tracking-wider text-white/50 mb-1">
                {t('profile.country')}
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Netherlands"
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-sm font-tech focus:outline-none focus:border-primary/50 transition-colors placeholder:text-white/20"
                data-testid="input-profile-country"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-tech uppercase tracking-wider text-white/50 mb-1">
              {t('profile.instagram')} <span className="text-white/30">({t('profile.optional')})</span>
            </label>
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@yourusername"
              className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-sm font-tech focus:outline-none focus:border-primary/50 transition-colors placeholder:text-white/20"
              data-testid="input-profile-instagram"
            />
          </div>

          {(error || updateProfileError) && (
            <p className="text-red-400 text-xs font-tech" data-testid="text-profile-error">
              {error || updateProfileError?.message}
            </p>
          )}

          <p className="text-[10px] text-white/30 font-tech">
            {t('profile.marketingConsent')}
          </p>

          <Button
            type="submit"
            disabled={isUpdatingProfile}
            className="w-full bg-primary text-black hover:bg-primary/80 rounded-none font-tech uppercase tracking-wider text-xs h-11"
            data-testid="button-complete-profile"
          >
            {isUpdatingProfile ? t('profile.saving') : t('profile.completeSignUp')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
