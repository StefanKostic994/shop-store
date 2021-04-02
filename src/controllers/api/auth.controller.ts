import { Body, Controller, Post, Req } from "@nestjs/common";
import { LoginAdministratorDto } from "src/dtos/administrator/login.administrator.dto";
import { ApiResponse } from "src/misc/api.response.class";
import { AdministratorService } from "src/services/administrator/administrator.service";
import * as crypto from 'crypto';
import { LoginInfoAdministrtorDto } from "src/dtos/administrator/login.info.administrator.dto";
import * as jwt from 'jsonwebtoken';
import { JwtDataAdministratorDto } from "src/dtos/administrator/jwt.data.administrator.dto";
import { Request } from "express";
import { jwtSecret } from "config/jwt.secret";

@Controller('auth')
export class AuthController {
    constructor(public administratorService: AdministratorService) { }

    @Post('login')
    async doLogin(@Body() data: LoginAdministratorDto, @Req() req: Request): Promise<LoginInfoAdministrtorDto |ApiResponse> {
        const administrator = await this.administratorService.getByUsername(data.username);
        if(!administrator) {
            return new Promise(resolve =>  resolve(new ApiResponse('error', -3001)));
        }

        const passwordHash = crypto.createHash('sha512');
        passwordHash.update(data.password);
        const passwordHashString = passwordHash.digest('hex').toUpperCase();

        if(administrator.passwordHash !== passwordHashString) {
            return new Promise(resolve =>  resolve(new ApiResponse('error', -3002)));
        }

        //administratorId
        //username
        //token(JWT)
        // Tajna sifra
        //JSON = { administratorId,username,exp, ip,useragent}
        //Sifrovanje x primenjuje tajnu sifru na ovaj nas json i dobija se 
        //neki sifrovan podatak dakle nekakav sifrat binarni i mi njega pomocu
        //base 64 enkodiramo i dobijamo nekakav hex string
        // i taj string je nesto sto ne moze da desifruje nas krajnji korisnik

        const jwtData = new JwtDataAdministratorDto();
        jwtData.administratorId = administrator.administratorId;
        jwtData.username = administrator.username;

        let sada = new Date();
        sada.setDate(sada.getDate() + 14);
        const istekTimeStamp = sada.getTime() / 1000;

        jwtData.ext = istekTimeStamp;

        jwtData.ip = req.ip.toString();

        jwtData.ua = req.headers["user-agent"];
        
        let token: string = jwt.sign(jwtData.toPlainObject(), jwtSecret);

        const responseObject = new LoginInfoAdministrtorDto(
            administrator.administratorId,
            administrator.username,
            token
        );

        return new Promise(resolve => resolve(responseObject));

    }

}

//"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbmlzdHJhdG9ySWQiOjEwLCJ
//1c2VybmFtZSI6ImFkbWluIiwiZXh0IjoxNjE4NTk0MDQ2LjgzLCJpcCI6Ijo6MSIsInVh
//IjoiUG9zdG1hblJ1bnRpbWUvNy4yNi4xMCIsImlhdCI6MTYxNzM4NDQ0Nn0.SF_G-l4tyuJdq_MYsJm24lPkHtNcEGGgBnAPhjTWtmc"