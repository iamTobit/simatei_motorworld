import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldError } from "./states";
import * as enquiriesApi from "@/lib/api/enquiries";
import { ApiError, errorMessage, fieldErrorsOf } from "@/lib/api/client";
import { ENQUIRY_TYPES, type EnquiryType } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";

export function EnquiryForm({
  carId,
  defaultType = "Buy",
  onSubmitted,
}: {
  carId?: number | undefined;
  defaultType?: EnquiryType;
  onSubmitted?: (() => void) | undefined;
}) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [enquiryType, setEnquiryType] = useState<EnquiryType>(defaultType);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      enquiriesApi.createEnquiry({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() ? phone.trim() : null,
        message: message.trim(),
        enquiry_type: enquiryType,
        car_id: carId ?? null,
      }),
    onSuccess: () => {
      setError(null);
      setSent(true);
      setMessage("");
      toast.success("Enquiry sent — our team will be in touch");
      onSubmitted?.();
    },
    onError: (caught) => {
      setSent(false);
      setError(caught);
      toast.error(errorMessage(caught));
    },
  });

  const fieldErrors = fieldErrorsOf(error);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const local: Record<string, string[]> = {};
    if (!name.trim()) local["name"] = ["Enter your name"];
    if (!email.trim()) local["email"] = ["Enter your email address"];
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      local["email"] = ["Enter a valid email address"];
    if (!message.trim()) local["message"] = ["Tell us what you'd like to know"];

    if (Object.keys(local).length > 0) {
      setError(new ApiError("Please fix the highlighted fields.", 400, local));
      return;
    }
    setError(null);
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(error)}</AlertDescription>
        </Alert>
      ) : null}
      {sent ? (
        <Alert>
          <AlertDescription>
            Thanks — your enquiry has been received. We'll reply to {email.trim()}.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="enquiry-name">Name</Label>
          <Input
            id="enquiry-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(fieldErrors["name"])}
            className="mt-1.5"
          />
          <FieldError messages={fieldErrors["name"]} />
        </div>
        <div>
          <Label htmlFor="enquiry-email">Email</Label>
          <Input
            id="enquiry-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(fieldErrors["email"])}
            className="mt-1.5"
          />
          <FieldError messages={fieldErrors["email"]} />
        </div>
        <div>
          <Label htmlFor="enquiry-phone">
            Phone <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="enquiry-phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-1.5"
          />
          <FieldError messages={fieldErrors["phone"]} />
        </div>
        <div>
          <Label htmlFor="enquiry-type">Enquiry type</Label>
          <Select value={enquiryType} onValueChange={(value) => setEnquiryType(value as EnquiryType)}>
            <SelectTrigger id="enquiry-type" className="mt-1.5 w-full">
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              {ENQUIRY_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError messages={fieldErrors["enquiry_type"]} />
        </div>
      </div>

      <div>
        <Label htmlFor="enquiry-message">Message</Label>
        <Textarea
          id="enquiry-message"
          rows={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          aria-invalid={Boolean(fieldErrors["message"])}
          className="mt-1.5"
          placeholder="I'd like to know more about this vehicle…"
        />
        <FieldError messages={fieldErrors["message"]} />
      </div>

      <Button type="submit" disabled={mutation.isPending} className="w-full sm:w-auto">
        {mutation.isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="size-4" aria-hidden="true" />
        )}
        Send enquiry
      </Button>
    </form>
  );
}
