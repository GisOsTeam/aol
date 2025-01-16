import JSZip = require('jszip');

interface IZipSecurityCheckOptions {
  maxTotalSize: number;
  nbMaxFiles: number;
}
export type ZipSecurityCheckOptions = IZipSecurityCheckOptions;

const defaultZipSecurityCheckOpts: ZipSecurityCheckOptions = {
  maxTotalSize: 1000000000, // 1 GB
  nbMaxFiles: 10000,
};

/**
 * Check whether a JSZip is safe or not.
 *
 * @param zip JS Zip to check
 * @param opts security options
 * @returns promise true if zip is safe, false otherwise
 */
export async function checkJSZipSecurity(zip: JSZip, opts?: ZipSecurityCheckOptions): Promise<boolean> {
  // Setup security options
  const zipSecurityCheckOpts: ZipSecurityCheckOptions = defaultZipSecurityCheckOpts;
  if (opts != null) {
    if (opts.maxTotalSize != null) {
      zipSecurityCheckOpts.maxTotalSize = opts.maxTotalSize;
    }
    if (opts.nbMaxFiles != null) {
      zipSecurityCheckOpts.nbMaxFiles = opts.nbMaxFiles;
    }
  }

  let fileCount = 0;
  let totalSize = 0;

  try {
    // Loop through ZIP content
    for (const zipEntry of Object.values(zip.files)) {
      // Prevent number of files from exceeding the limit
      fileCount++;
      if (fileCount > zipSecurityCheckOpts.nbMaxFiles) {
        throw 'Reached max. number of files';
      }

      // ZipSlip path traversal (S6096) fixed in commit https://github.com/Stuk/jszip/commit/2edab366119c9ee948357c02f1206c28566cdf15 (in jszip v3.8.0)
      // OK since jszip v3.8.0, see zipEntry.unsafeOriginalName for unsanitized data

      // Prevent total ZIP size from exceeding the limit
      if (zip.file(zipEntry.name)) {
        await zip
          .file(zipEntry.name)
          .async('arraybuffer')
          .then(function (content) {
            totalSize += content.byteLength;
            if (totalSize > zipSecurityCheckOpts.maxTotalSize) {
              throw 'Reached max. size';
            }
          });
      }
    }
    console.info('ZIP is considered safe');
    return true;
  } catch (err) {
    console.error('ZIP is considered unsafe');
    return false;
  }
}
