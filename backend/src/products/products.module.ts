import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  providers: [ProductsService],
  controllers: [ProductsController],
  exports:[ProductsService],
  imports:[StorageModule]
})
export class ProductsModule {}
