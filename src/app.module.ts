import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AddressesModule } from './addresses/addresses.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { TestimonialsModule } from './testimonials/testimonials.module';
import { BlogsModule } from './blogs/blogs.module';
import { CartModule } from './cart/cart.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { ContactModule } from './contact/contact.module';
import { SpaServiceModule } from './spa-service/spa-service.module';
import { BookingModule } from './booking/booking.module';
import { CheckoutModule } from './checkout/checkout.module';
import { WebhookModule } from './webhook/webhook.module';
import { ConsultationModule } from './consultation/consultation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CloudinaryModule,
    MailModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    AddressesModule,
    CategoriesModule,
    ProductsModule,
    TestimonialsModule,
    BlogsModule,
    CartModule,
    WishlistModule,
    ContactModule,
    SpaServiceModule,
    BookingModule,
    CheckoutModule,
    WebhookModule,
    ConsultationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
