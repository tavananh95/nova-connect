"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import axios from "axios";
import Image from "next/image";
import { logger } from "@/lib/logger";
import { useRouter } from "next/navigation";
import { requireApiBaseUrl, getMissingApiBaseUrlMessage } from "@/lib/api-base-url";

const formSchema = z.object({
  username: z.string().min(3),
  first_name: z.string().min(3),
  last_name: z.string().min(3),
  birth_date: z.date(),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Au moins une majuscule")
    .regex(/[a-z]/, "Au moins une minuscule")
    .regex(/[0-9]/, "Au moins un chiffre")
    .regex(/[^A-Za-z0-9]/, "Au moins un caractère spécial"),
});

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      first_name: "",
      last_name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    try {
      let apiBaseUrl: string;
      try {
        apiBaseUrl = requireApiBaseUrl();
      } catch {
        form.setError("email", {
          message: getMissingApiBaseUrlMessage(),
        });
        return;
      }

      const formData = new FormData();
      formData.append("username", values.username);
      formData.append("firstName", values.first_name); // camelCase requis par le backend
      formData.append("lastName", values.last_name);
      formData.append(
        "birthDate",
        values.birth_date.toISOString().split("T")[0]
      );
      formData.append("email", values.email);
      formData.append("password", values.password);
      if (avatar) {
        formData.append("avatar", avatar);
      }

      // Debug : afficher ce qui est envoyé
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      const response = await axios.post(
        `${apiBaseUrl}/api/v1/auth/register`,
        formData
      );
      logger.info("Register success:", response.data);
      setIsSuccess(true);
      router.push("/auth/login");
    } catch (error: any) {
      const data = error.response?.data;

      console.error("Erreur complète :", JSON.stringify(data, null, 2)); // <-- log lisible
      logger.error("Erreur d'inscription:", error);

      form.setError("email", {
        message:
          data?.message ||
          (Array.isArray(data?.errors)
            ? data.errors[0]?.message
            : "Erreur lors de l'inscription."),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 space-y-6 text-center">
        <CheckCircle2 className="h-16 w-16 text-teal-500 mx-auto" />
        <h2 className="text-2xl font-bold">Inscription réussie !</h2>
        <Button className="w-full" onClick={() => router.push("/auth/login")}>
          Aller à la connexion
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden text-black">
      <div className="p-8 space-y-6">
        <div className="text-center space-y-2">
          <Image
            src="/images/nova-connect-logo.png"
            alt="Logo"
            width={60}
            height={60}
            className="h-10 w-10 rounded-xl"
          />
          <div className="font-semibold text-xl">Nova Connect</div>
          <h1 className="text-2xl font-bold">Créer un compte</h1>
          <p className="text-gray-600 text-sm">Rejoignez la communauté</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              name="username"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black">
                    Nom d'utilisateur
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ex: johndoe"
                      {...field}
                      className="text-black bg-white placeholder:text-gray-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="first_name"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Prénom</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Frédéric"
                        {...field}
                        className="text-black bg-white placeholder:text-gray-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="last_name"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Nom</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Sananes"
                        {...field}
                        className="text-black bg-white placeholder:text-gray-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              name="birth_date"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date de naissance</FormLabel>
                  <Popover>
                    {/* Trigger : on affiche maintenant un champ date natif */}
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Input
                          type="date"
                          value={
                            field.value ? format(field.value, "yyyy-MM-dd") : ""
                          }
                          onChange={(e) =>
                            field.onChange(new Date(e.target.value))
                          }
                          min="1900-01-01"
                          max={format(new Date(), "yyyy-MM-dd")}
                          className="w-full py-2"
                        />
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      {/* Champ date manuel dans le popup pour saisie rapide */}
                      <input
                        type="date"
                        className="w-full p-2 border-b"
                        value={
                          field.value ? format(field.value, "yyyy-MM-dd") : ""
                        }
                        onChange={(e) =>
                          field.onChange(new Date(e.target.value))
                        }
                        min="1900-01-01"
                        max={format(new Date(), "yyyy-MM-dd")}
                      />
                      {/* Calendrier avec dropdown mois/année */}
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        captionLayout="dropdown"
                        fromYear={1900}
                        toYear={new Date().getFullYear()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black">Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="salah@esgi.com"
                      {...field}
                      className="text-black bg-white placeholder:text-gray-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black">Mot de passe</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...field}
                        className="text-black bg-white"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs text-gray-600">
                    8 caractères minimum, incluant majuscule, minuscule, chiffre
                    et caractère spécial
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-1.5">
              <label
                htmlFor="avatar"
                className="text-sm font-medium text-black"
              >
                Avatar
              </label>
              <Input
                id="avatar"
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/gif"
                onChange={(e) => setAvatar(e.target.files?.[0] || null)}
                className="text-black bg-white"
              />
            </div>

            <Button
              type="submit"
              className="w-full gap-2 bg-gradient-to-r from-violet-300 to-pink-100 rounded-full text-sm font-medium text-violet-700 mb-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Création en cours..." : "Créer un compte"}
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm text-gray-600">
          Vous avez déjà un compte ?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-teal-600 hover:text-teal-500"
          >
            Connectez-vous
          </Link>
        </div>
      </div>
    </div>
  );
}
