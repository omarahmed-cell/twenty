import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { createHash, randomBytes, timingSafeEqual } from 'crypto';

import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';
import { Like, Repository } from 'typeorm';
import { v4 } from 'uuid';

import {
  KeyValuePairEntity,
  KeyValuePairType,
} from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';

const TOKEN_KEY_PREFIX = 'GMAIL_EXTENSION_TOKEN:';
const TOKEN_PREFIX = 'rgx';
const TOKEN_FORMAT = /^rgx_([0-9a-f-]{36})_([A-Za-z0-9_-]{43})$/;

type StoredToken = {
  secretHash: string;
  workspaceMemberId: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export type GmailExtensionTokenSummary = {
  id: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export type GmailExtensionCaller = {
  tokenId: string;
  userId: string;
  workspaceId: string;
  workspaceMemberId: string;
};

const hashSecret = (secret: string) =>
  createHash('sha256').update(secret).digest('hex');

@Injectable()
export class GmailExtensionTokenService {
  constructor(
    @InjectRepository(KeyValuePairEntity)
    private readonly keyValuePairRepository: Repository<KeyValuePairEntity>,
  ) {}

  async list({
    userId,
    workspaceId,
  }: {
    userId: string;
    workspaceId: string;
  }): Promise<GmailExtensionTokenSummary[]> {
    const rows = await this.keyValuePairRepository.find({
      where: {
        userId,
        workspaceId,
        type: KeyValuePairType.USER_VARIABLE,
        key: Like(`${TOKEN_KEY_PREFIX}%`),
      },
      order: { createdAt: 'DESC' },
    });

    return rows.map((row) => {
      const value = row.value as unknown as StoredToken;

      return {
        id: row.key.slice(TOKEN_KEY_PREFIX.length),
        createdAt: value.createdAt,
        lastUsedAt: value.lastUsedAt,
      };
    });
  }

  // The secret is returned once; only its hash is kept
  async create({
    userId,
    workspaceId,
    workspaceMemberId,
  }: {
    userId: string;
    workspaceId: string;
    workspaceMemberId: string;
  }): Promise<{ id: string; token: string }> {
    const id = v4();
    const secret = randomBytes(32).toString('base64url');
    const value: StoredToken = {
      secretHash: hashSecret(secret),
      workspaceMemberId,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
    };

    await this.keyValuePairRepository.save(
      this.keyValuePairRepository.create({
        id,
        userId,
        workspaceId,
        type: KeyValuePairType.USER_VARIABLE,
        key: `${TOKEN_KEY_PREFIX}${id}`,
        value: value as unknown as JSON,
      }),
    );

    return { id, token: `${TOKEN_PREFIX}_${id}_${secret}` };
  }

  async revoke({
    userId,
    workspaceId,
    id,
  }: {
    userId: string;
    workspaceId: string;
    id: string;
  }): Promise<boolean> {
    const result = await this.keyValuePairRepository.delete({
      userId,
      workspaceId,
      key: `${TOKEN_KEY_PREFIX}${id}`,
    });

    return (result.affected ?? 0) > 0;
  }

  async verify(
    token: string | undefined,
  ): Promise<GmailExtensionCaller | null> {
    const match = isNonEmptyString(token) ? TOKEN_FORMAT.exec(token) : null;

    if (!isDefined(match)) {
      return null;
    }

    const [, id, secret] = match;
    const row = await this.keyValuePairRepository.findOne({
      where: { key: `${TOKEN_KEY_PREFIX}${id}` },
    });

    if (
      !isDefined(row) ||
      !isDefined(row.userId) ||
      !isDefined(row.workspaceId)
    ) {
      return null;
    }

    const value = row.value as unknown as StoredToken;
    const expected = Buffer.from(value.secretHash, 'hex');
    const received = Buffer.from(hashSecret(secret), 'hex');

    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      return null;
    }

    await this.keyValuePairRepository.update(
      { id: row.id },
      {
        value: {
          ...value,
          lastUsedAt: new Date().toISOString(),
        } as unknown as JSON,
      },
    );

    return {
      tokenId: id,
      userId: row.userId,
      workspaceId: row.workspaceId,
      workspaceMemberId: value.workspaceMemberId,
    };
  }
}
