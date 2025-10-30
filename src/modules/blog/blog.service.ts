import { Prisma } from "../../generated/prisma";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { GetBlogsDTO } from "./dto/get-blogs.dto";

export class BlogService {
  private prisma: PrismaService;
  private cloudinaryService: CloudinaryService;
  private mailService: MailService;
  private redisService: RedisService;

  constructor() {
    this.prisma = new PrismaService();
    this.cloudinaryService = new CloudinaryService();
    this.mailService = new MailService();
    this.redisService = new RedisService();
  }

  getBlogs = async (query: GetBlogsDTO) => {
    const { page, take, sortBy, sortOrder, search, } = query;

    const whereClause: Prisma.BlogWhereInput = {};

    if (search) {
      whereClause.title = { contains: search, mode: "insensitive" };
    }

    const blogs = await this.prisma.blog.findMany({
      where: whereClause,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * take,
      take: take,
    });

    const count = await this.prisma.blog.count({
      where: whereClause,
    });

    return {
      data: blogs,
      meta: { page, take, total: count },
    };
  };
}
