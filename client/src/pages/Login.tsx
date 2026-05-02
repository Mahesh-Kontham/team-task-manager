import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", data);
      login(response.data.data);
      toast.success("Logged in successfully");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F8F7FF] p-4 text-[#111827]">
      <div className="w-full max-w-[360px] flex flex-col items-center">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white font-semibold text-lg">
            TF
          </div>
          <h1 className="text-[22px] font-medium tracking-tight mt-2">Welcome back</h1>
          <p className="text-[13px] text-muted-foreground">Log in to your TaskFlow account</p>
        </div>

        <Card className="w-full border-[0.5px] shadow-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-[13px] font-medium">Email</label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@company.com" 
                  error={!!errors.email}
                  {...register("email")} 
                />
                {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-[13px] font-medium">Password</label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  error={!!errors.password}
                  {...register("password")} 
                />
                {errors.password && <p className="text-[11px] text-red-500 mt-1">{errors.password.message}</p>}
              </div>
              
              <Button className="w-full mt-2" type="submit" isLoading={isLoading}>
                Log in
              </Button>

            </form>
          </CardContent>
        </Card>
        
        <p className="mt-6 text-center text-[13px] text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
