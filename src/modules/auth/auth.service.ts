import { JWT_SECRET } from "../../config/env";
import { ApiError } from "../../utils/api-error";
import { comparePassword, hashPassword } from "../../utils/password";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDTO } from "./dto/login.dto";
import { RegisterDTO } from "./dto/register.dto";
import { sign } from "jsonwebtoken";

export class AuthService {
  private prisma: PrismaService;

  constructor() {
    this.prisma = new PrismaService();
  }

  register = async (body: RegisterDTO) => {
    const user = await this.prisma.user.findFirst({
      where: { email: body.email },
    });

    if (user) {
      throw new ApiError("email already exist", 400);
    }

    const hashedPassword = await hashPassword(body.password);

    await this.prisma.user.create({
      data: { ...body, password: hashedPassword },
    });

    return { message: "register user success" };
  };

  login = async (body: LoginDTO) => {
    const user = await this.prisma.user.findFirst({
      where: { email: body.email },
    });

    if (!user) {
      throw new ApiError("Invalid credentials", 400);
    }

    const isPasswordValid = await comparePassword(body.password, user.password);

    if (!isPasswordValid) {
      throw new ApiError("Invalid credentials", 400);
    }
    const payload = { id: user.id, role: user.role };

    const accessToken = sign(payload, JWT_SECRET!, { expiresIn: "2h" });

    const { password, ...userWithoutPassword } = user;

    return { ...userWithoutPassword, accessToken };
  };
}
