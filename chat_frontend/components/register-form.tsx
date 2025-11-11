"use client";

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useWebSocket } from "@/lib/websocket-context"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useTranslations } from 'next-intl';

export function RegisterForm({ ...props }: React.ComponentProps<typeof Card>) {
  const t = useTranslations('register');
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [currentRequestId, setCurrentRequestId] = useState<number | null>(null)
  const { sendMessage, lastMessage, isConnected } = useWebSocket()
  const router = useRouter()

  useEffect(() => {
    if (lastMessage && currentRequestId && lastMessage.request_id === currentRequestId) {
      console.log('Formulário de registro recebeu resposta para solicitação atual:', lastMessage);
      if (lastMessage.status === 'ok') {
        console.log('Registro bem-sucedido');
        // Registro bem-sucedido
        setSuccess(t('accountCreated'));
        setError("");
        setIsLoading(false);
        setCurrentRequestId(null);
        // Redirecionar para login após um pequeno atraso
        setTimeout(() => {
          router.push('./login');
        }, 2000);
      } else if (lastMessage.status === 'error') {
        console.log('Registro falhou:', lastMessage.message);
        // Registro falhou
        setError(lastMessage.message || 'Registro falhou');
        setSuccess("");
        setIsLoading(false);
        setCurrentRequestId(null);
      }
    }
  }, [lastMessage, currentRequestId, router, t]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (!isConnected) {
      setError('Não conectado ao servidor');
      return;
    }

    setIsLoading(true);

    const requestId = sendMessage({
      type: 'register',
      username: username,
      password: password
    });
    setCurrentRequestId(requestId);

    // Timeout adicional de segurança (35 segundos)
    setTimeout(() => {
      if (isLoading) {
        console.log('Timeout de segurança atingido para registro');
        setIsLoading(false);
        setCurrentRequestId(null);
        setError('Tempo limite excedido. Tente novamente.');
      }
    }, 35000);
  };

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {t('title').toLowerCase()} com suas informações
          <div className="mt-2 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Conectado ao servidor' : 'Desconectado do servidor'}
            </span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="username">{t('username')}</FieldLabel>
              <Input
                id="username"
                type="text"
                placeholder={t('username').toLowerCase()}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">{t('password')}</FieldLabel>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <FieldDescription>
                {t('passwordHint')}
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">
                {t('confirmPassword')}
              </FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <FieldDescription>{t('confirmHint')}</FieldDescription>
            </Field>
            {error && (
              <Field>
                <FieldDescription className="text-red-500">
                  {error}
                </FieldDescription>
              </Field>
            )}
            {success && (
              <Field>
                <FieldDescription className="text-green-500">
                  {success}
                </FieldDescription>
              </Field>
            )}
            <Field>
              <Button type="submit" disabled={isLoading || !isConnected}>
                {isLoading ? t('creatingAccount') : t('createAccount')}
              </Button>
            </Field>
          </FieldGroup>
        </form>
        <div className="text-center text-sm mt-4">
          {t('haveAccount')}{" "}
          <Link href="/login" className="underline underline-offset-4 hover:underline">
            {t('login')}
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}