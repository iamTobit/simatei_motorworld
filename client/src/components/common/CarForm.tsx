import { useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CarPhoto } from "./CarPhoto";
import { FieldError } from "./states";
import type { CarPayload } from "@/lib/api/cars";
import { ApiError, errorMessage, fieldErrorsOf } from "@/lib/api/client";
import { CONDITIONS, FUEL_TYPES, TRANSMISSIONS, type Car } from "@/lib/api/types";
import { isValidHttpUrl } from "@/lib/format";

export type CarFormValues = {
  make: string;
  model: string;
  year: string;
  price: string;
  currency: string;
  mileage: string;
  condition: string;
  fuel_type: string;
  transmission: string;
  color: string;
  description: string;
  location: string;
  is_negotiable: boolean;
  images: string[];
};

export function emptyCarForm(): CarFormValues {
  return {
    make: "",
    model: "",
    year: String(new Date().getFullYear()),
    price: "",
    currency: "KES",
    mileage: "",
    condition: "Used",
    fuel_type: "Petrol",
    transmission: "Automatic",
    color: "",
    description: "",
    location: "",
    is_negotiable: false,
    images: [],
  };
}

export function carToForm(car: Car): CarFormValues {
  const ordered = [...(car.images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary),
  );
  return {
    make: car.make,
    model: car.model,
    year: String(car.year),
    price: String(car.price),
    currency: car.currency || "KES",
    mileage: car.mileage === null ? "" : String(car.mileage),
    condition: car.condition,
    fuel_type: car.fuel_type,
    transmission: car.transmission,
    color: car.color ?? "",
    description: car.description ?? "",
    location: car.location ?? "",
    is_negotiable: car.is_negotiable,
    images: ordered.map((image) => image.url),
  };
}

export function CarForm({
  values,
  onChange,
  onSubmit,
  submitting,
  error,
  submitLabel,
  secondaryAction,
}: {
  values: CarFormValues;
  onChange: (values: CarFormValues) => void;
  onSubmit: (payload: CarPayload) => void;
  submitting: boolean;
  error: unknown;
  submitLabel: string;
  secondaryAction?: React.ReactNode;
}) {
  const [localError, setLocalError] = useState<ApiError | null>(null);
  const [newImage, setNewImage] = useState("");

  const fieldErrors = { ...fieldErrorsOf(localError), ...fieldErrorsOf(error) };

  function set<K extends keyof CarFormValues>(key: K, value: CarFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  function addImage() {
    const url = newImage.trim();
    if (!url) return;
    if (!isValidHttpUrl(url)) {
      setLocalError(
        new ApiError("Please fix the highlighted fields.", 400, {
          images: ["Enter a valid image URL starting with http:// or https://"],
        }),
      );
      return;
    }
    if (values.images.includes(url)) {
      setLocalError(
        new ApiError("Please fix the highlighted fields.", 400, {
          images: ["That image URL has already been added."],
        }),
      );
      return;
    }
    if (values.images.length >= 10) {
      setLocalError(
        new ApiError("Please fix the highlighted fields.", 400, {
          images: ["You can add a maximum of 10 images."],
        }),
      );
      return;
    }
    setLocalError(null);
    set("images", [...values.images, url]);
    setNewImage("");
  }

  function move(index: number, delta: number) {
    const next = [...values.images];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    const current = next[index]!;
    next[index] = next[target]!;
    next[target] = current;
    set("images", next);
  }

  function makePrimary(index: number) {
    const next = [...values.images];
    const [picked] = next.splice(index, 1);
    if (picked) next.unshift(picked);
    set("images", next);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const problems: Record<string, string[]> = {};
    if (!values.make.trim()) problems["make"] = ["Enter the make"];
    if (!values.model.trim()) problems["model"] = ["Enter the model"];
    const year = Number(values.year);
    if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 1)
      problems["year"] = ["Enter a valid year"];
    const price = Number(values.price);
    if (!Number.isFinite(price) || price <= 0) problems["price"] = ["Enter a price above zero"];
    if (values.mileage.trim() && Number(values.mileage) < 0)
      problems["mileage"] = ["Mileage cannot be negative"];
    if (values.images.length === 0) problems["images"] = ["Add at least one image URL"];

    if (Object.keys(problems).length > 0) {
      setLocalError(new ApiError("Please fix the highlighted fields.", 400, problems));
      return;
    }
    setLocalError(null);

    onSubmit({
      make: values.make.trim(),
      model: values.model.trim(),
      year,
      price,
      currency: values.currency.trim() || "KES",
      mileage: values.mileage.trim() ? Number(values.mileage) : null,
      condition: values.condition,
      fuel_type: values.fuel_type,
      transmission: values.transmission,
      color: values.color.trim() ? values.color.trim() : null,
      description: values.description.trim() ? values.description.trim() : null,
      location: values.location.trim() ? values.location.trim() : null,
      is_negotiable: values.is_negotiable,
      images: values.images,
    });
  }

  const visibleError = error ?? localError;

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {visibleError ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(visibleError)}</AlertDescription>
        </Alert>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg heading-xl">Vehicle details</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="car-make">Make</Label>
            <Input
              id="car-make"
              value={values.make}
              onChange={(event) => set("make", event.target.value)}
              className="mt-1.5"
              placeholder="Toyota"
            />
            <FieldError messages={fieldErrors["make"]} />
          </div>
          <div>
            <Label htmlFor="car-model">Model</Label>
            <Input
              id="car-model"
              value={values.model}
              onChange={(event) => set("model", event.target.value)}
              className="mt-1.5"
              placeholder="Land Cruiser Prado"
            />
            <FieldError messages={fieldErrors["model"]} />
          </div>
          <div>
            <Label htmlFor="car-year">Year</Label>
            <Input
              id="car-year"
              type="number"
              inputMode="numeric"
              value={values.year}
              onChange={(event) => set("year", event.target.value)}
              className="mt-1.5"
            />
            <FieldError messages={fieldErrors["year"]} />
          </div>
          <div>
            <Label htmlFor="car-mileage">
              Mileage in km <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="car-mileage"
              type="number"
              inputMode="numeric"
              value={values.mileage}
              onChange={(event) => set("mileage", event.target.value)}
              className="mt-1.5"
            />
            <FieldError messages={fieldErrors["mileage"]} />
          </div>
          <div>
            <Label htmlFor="car-price">Price</Label>
            <Input
              id="car-price"
              type="number"
              inputMode="numeric"
              value={values.price}
              onChange={(event) => set("price", event.target.value)}
              className="mt-1.5"
              placeholder="6500000"
            />
            <FieldError messages={fieldErrors["price"]} />
          </div>
          <div>
            <Label htmlFor="car-currency">Currency</Label>
            <Input
              id="car-currency"
              value={values.currency}
              onChange={(event) => set("currency", event.target.value.toUpperCase())}
              className="mt-1.5"
              maxLength={5}
            />
            <FieldError messages={fieldErrors["currency"]} />
          </div>

          <FormSelect
            id="car-condition"
            label="Condition"
            value={values.condition}
            options={[...CONDITIONS]}
            onChange={(value) => set("condition", value)}
            messages={fieldErrors["condition"]}
          />
          <FormSelect
            id="car-fuel"
            label="Fuel type"
            value={values.fuel_type}
            options={[...FUEL_TYPES]}
            onChange={(value) => set("fuel_type", value)}
            messages={fieldErrors["fuel_type"]}
          />
          <FormSelect
            id="car-transmission"
            label="Transmission"
            value={values.transmission}
            options={[...TRANSMISSIONS]}
            onChange={(value) => set("transmission", value)}
            messages={fieldErrors["transmission"]}
          />
          <div>
            <Label htmlFor="car-color">
              Colour <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="car-color"
              value={values.color}
              onChange={(event) => set("color", event.target.value)}
              className="mt-1.5"
            />
            <FieldError messages={fieldErrors["color"]} />
          </div>
          <div>
            <Label htmlFor="car-location">
              Location <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="car-location"
              value={values.location}
              onChange={(event) => set("location", event.target.value)}
              className="mt-1.5"
              placeholder="Nairobi"
            />
            <FieldError messages={fieldErrors["location"]} />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4 sm:col-span-2">
            <div>
              <Label htmlFor="car-negotiable">Price is negotiable</Label>
              <p className="text-xs text-muted-foreground">
                Buyers will see that you're open to offers.
              </p>
            </div>
            <Switch
              id="car-negotiable"
              checked={values.is_negotiable}
              onCheckedChange={(checked) => set("is_negotiable", checked)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="car-description">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="car-description"
              rows={5}
              value={values.description}
              onChange={(event) => set("description", event.target.value)}
              className="mt-1.5"
              placeholder="Service history, extras, recent work…"
            />
            <FieldError messages={fieldErrors["description"]} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg heading-xl">Photos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add between 1 and 10 image links. The first photo is used as the main image.
        </p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Input
            value={newImage}
            onChange={(event) => setNewImage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addImage();
              }
            }}
            placeholder="https://example.com/photo.jpg"
            aria-label="Image URL"
          />
          <Button type="button" variant="outline" onClick={addImage}>
            <Plus className="size-4" aria-hidden="true" />
            Add photo
          </Button>
        </div>
        <FieldError messages={fieldErrors["images"]} />

        {values.images.length > 0 ? (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {values.images.map((url, index) => (
              <li key={url} className="overflow-hidden rounded-lg border border-border">
                <div className="aspect-[4/3] bg-muted">
                  <CarPhoto url={url} alt={`Vehicle photo ${index + 1}`} className="size-full" />
                </div>
                <div className="flex items-center justify-between gap-1 p-2">
                  <span className="truncate text-xs text-muted-foreground">
                    {index === 0 ? "Main photo" : `Photo ${index + 1}`}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Make photo ${index + 1} the main photo`}
                      onClick={() => makePrimary(index)}
                      disabled={index === 0}
                    >
                      <Star className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Move photo ${index + 1} earlier`}
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Move photo ${index + 1} later`}
                      onClick={() => move(index, 1)}
                      disabled={index === values.images.length - 1}
                    >
                      <ArrowDown className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove photo ${index + 1}`}
                      onClick={() =>
                        set(
                          "images",
                          values.images.filter((image) => image !== url),
                        )
                      }
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {submitLabel}
        </Button>
        {secondaryAction}
      </div>
    </form>
  );
}

function FormSelect({
  id,
  label,
  value,
  options,
  onChange,
  messages,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  messages?: string[] | undefined;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="mt-1.5 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError messages={messages} />
    </div>
  );
}
