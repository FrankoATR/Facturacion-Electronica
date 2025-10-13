import { userService } from "../users/user.service";
import { verifyPassword } from "../../utils/password";
import { signToken } from "../../utils/jwt";

export const authService = {
  async login(email: string, password: string) {
    const user = await userService.findByEmail(email);
    if (!user || !user.isActive) return null as any;
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return null as any;
    await userService.touchLastLogin(user.id);
    const token = signToken({ id: user.id, email: user.email, role: user.role as any });
    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  },
};


