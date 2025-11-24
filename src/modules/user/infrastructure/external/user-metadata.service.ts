import { Inject, Injectable, Logger } from "@nestjs/common";
import { RemoteConfigService } from "src/modules/shared/firebase/remote-config/remote-config.service";
import { Role } from "../../domain/model/role.model";
import { parsefromString, parseKeyValueConfigs } from "src/shared/utilities/kv-config.util";
import { KeyValueConfig } from "src/shared/models/key-value-config.model";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import * as path from 'path';
import fs from "fs";
import { KeyValue } from "src/shared/dto/KeyValue.dto";

@Injectable()
export class UserMetadataService {
    private readonly logger = new Logger(UserMetadataService.name);
    constructor(private readonly configService: RemoteConfigService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async getAllRoles(): Promise<Role[]> {
        const remoteConfig = await this.configService.getAllKeyValues();
        const roles = parseKeyValueConfigs(remoteConfig['USER_ROLES'].value);
        return roles.map(r => new Role('', r.KEY, r.VALUE, r.getAttribute<string>('AUTH0_ROLE'), r.getAttribute<boolean>('DEFAULT')));
    }

    async getReferenceData() {
        const keyValueConfigs = await this.configService.getAllKeyValues()
        const status = parsefromString<KeyValueConfig[]>(keyValueConfigs['PROFILE_STATUSES'].value);
        const connections = parsefromString<KeyValueConfig[]>(keyValueConfigs['USER_CONNECTIONS'].value)
        const genders = parsefromString<KeyValueConfig[]>(keyValueConfigs['USER_GENDERS'].value)
        const roles = parsefromString<KeyValueConfig[]>(keyValueConfigs['USER_ROLES'].value)
        const titles = parsefromString<KeyValueConfig[]>(keyValueConfigs['USER_TITLES'].value)
        const cached = await this.getCachedData();

        return {
            status: status,
            loginMethods: connections,
            userGenders: genders,
            availableRoles: roles,
            userTitles: titles,
            dialCodes: cached['COUNTRY_LIST'].map(data => {
                return {
                    KEY: data.ATTRIBUTES['KEY'],
                    VALUE: data.ATTRIBUTES['DIALCODE'],
                    DESCRIPTION: `${data.VALUE} (${data.ATTRIBUTES['DIALCODE']})`
                } as KeyValueConfig;
            }),
            countryData: cached['COUNTRY_LIST'].map(this.mapData),
            stateData: cached['STATE_LIST'],
            districtData: cached['DISTRICT_LIST']
        }
    }


    private async getCachedData() {
        var cached = await this.cacheManager.get<Record<string, KeyValueConfig[]>>('LOCATION_DATA');
        if (!cached) {
            this.logger.log('Caching location data...')
            const dataDir = path.join(__dirname, './../../data');
            const locationFile = 'location.json';
            const filePath = path.join(dataDir, locationFile);
            this.logger.log('location data path ' + filePath)
            const source = fs.readFileSync(filePath, 'utf-8');
            cached = parsefromString<Record<string, KeyValueConfig[]>>(source);
            await this.cacheManager.set('LOCATION_DATA', cached);
            this.logger.log('Caching location data completed...')
        }
        this.logger.log('Using cached location data...', cached)
        return cached;
    }

    async getStates(countryCode: string): Promise<KeyValueConfig[]> {
        const cached = await this.getCachedData();
        return cached['STATE_LIST']
            .filter(data => data.ATTRIBUTES['COUNTRYKEY'] === countryCode)
            .map(this.mapData);
    }


    async getDistricts(countryCode: string, stateCode: string): Promise<KeyValueConfig[]> {
        const cached = await this.getCachedData();
        return cached['DISTRICT_LIST']
            .filter(data => data.ATTRIBUTES['COUNTRYKEY'] === countryCode && data.ATTRIBUTES['STATEKEY'] === stateCode)
            .map(this.mapData);
    }

    private mapData(data: KeyValueConfig): KeyValueConfig {
        return {
            KEY: data.KEY,
            VALUE: data.VALUE,
            DESCRIPTION: `${data.VALUE} (${data.KEY})`
        } as KeyValueConfig
    }

}