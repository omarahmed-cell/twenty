import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Command, CommandRunner, Option } from 'nest-commander';
import { ConnectedAccountProvider } from 'twenty-shared/types';
import { Repository } from 'typeorm';

import { ConnectedAccountEntity } from 'src/engine/metadata-modules/connected-account/entities/connected-account.entity';
import { GoogleMeetRecordingsImportService } from 'src/modules/call-recording/google-meet/services/google-meet-recordings-import.service';

type ImportGoogleMeetRecordingsOptions = { days?: number };

// Backfill after an account is reconnected with the Meet scopes, without waiting for the hourly cron
@Command({
  name: 'calendar:import-google-meet-recordings',
  description:
    'Import Google Meet recordings, transcripts and Gemini notes for every Google account now',
})
export class ImportGoogleMeetRecordingsCommand extends CommandRunner {
  private readonly logger = new Logger(ImportGoogleMeetRecordingsCommand.name);

  constructor(
    private readonly googleMeetRecordingsImportService: GoogleMeetRecordingsImportService,
    @InjectRepository(ConnectedAccountEntity)
    private readonly connectedAccountRepository: Repository<ConnectedAccountEntity>,
  ) {
    super();
  }

  @Option({
    flags: '-d, --days <days>',
    description: 'How many days back to look for recorded meetings',
  })
  parseDays(value: string): number {
    return Number(value);
  }

  async run(
    _passedParams: string[],
    options: ImportGoogleMeetRecordingsOptions,
  ): Promise<void> {
    const connectedAccounts = await this.connectedAccountRepository.find({
      where: { provider: ConnectedAccountProvider.GOOGLE },
    });

    for (const connectedAccount of connectedAccounts) {
      const result =
        await this.googleMeetRecordingsImportService.importForConnectedAccount({
          workspaceId: connectedAccount.workspaceId,
          connectedAccountId: connectedAccount.id,
          lookbackDays: options.days ?? 30,
        });

      if (result.skippedForMissingScopes) {
        this.logger.warn(
          `${connectedAccount.handle}: reconnect the account to grant the Google Meet scopes`,
        );
        continue;
      }

      this.logger.log(
        `${connectedAccount.handle}: imported ${result.imported.length} [${result.imported.join('; ')}]`,
      );

      if (result.unmatched.length > 0) {
        this.logger.warn(
          `${connectedAccount.handle}: no synced meeting for ${result.unmatched.join('; ')}`,
        );
      }

      if (result.inaccessible.length > 0) {
        this.logger.warn(
          `${connectedAccount.handle}: Meet files not readable for ${result.inaccessible.join('; ')}`,
        );
      }
    }
  }
}
