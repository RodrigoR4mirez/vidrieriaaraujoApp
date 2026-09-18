"use client";
import { useHydrated } from "./use-hydrated";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, ArrowRight, LockKeyhole } from "lucide-react";
import { loginAction } from "@/app/actions";
import { Button, Notice } from "./ui";
export function LoginForm() {
  const hydrated = useHydrated();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<{ username: string; password: string; remember: boolean }>({
    defaultValues: { remember: false },
  });
  return (
    <form
      method="post"
      className="form-stack"
      onSubmit={handleSubmit(async (values) => {
        setError("");
        const result = await loginAction(values);
        if (!result.ok) setError(result.error);
        else {
          router.push("/cotizador");
          router.refresh();
        }
      })}
    >
      <div className="field">
        <label htmlFor="username">Usuario o correo</label>
        <input
          id="username"
          autoComplete="username"
          placeholder="Tu usuario"
          required
          {...register("username")}
        />
      </div>
      <div className="field">
        <label htmlFor="password">Contraseña</label>
        <div className="password-input">
          <input
            id="password"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            required
            {...register("password")}
          />
          <button
            type="button"
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>
      </div>
      <label className="checkbox">
        <input type="checkbox" {...register("remember")} />
        Recordar sesión
      </label>
      {error && <Notice error>{error}</Notice>}
      <Button disabled={isSubmitting || !hydrated} type="submit">
        {isSubmitting ? "Ingresando…" : "Ingresar al Cotizador"}
        <ArrowRight size={18} />
      </Button>
      <p className="login-note">
        <LockKeyhole size={13} /> Acceso privado para el equipo Araujo
      </p>
    </form>
  );
}
