import { LoadingButton } from '@mui/lab';
import { Divider, Link, TextField, alpha } from '@mui/material';
import Image from 'next/image';
import { useSnackbar } from 'notistack';
import { FC, useCallback, useMemo } from 'react';

import { FlexBox } from '@/components/FlexBox';
import { Line } from '@/components/Text';
import { Integration } from '@/constants/integrations';
import { useAuth } from '@/hooks/useAuth';
import { useBoolState, useEasyState } from '@/hooks/useEasyState';
import { fetchCurrentOrg } from '@/slices/auth';
import { fetchTeams } from '@/slices/team';
import { useDispatch } from '@/store';
import { 
    linkProvider, 
    checkBitbucketValidity, getMissingBitbucketPermissions
} from '@/utils/auth';
import { depFn } from '@/utils/fn';

export const ConfigureBitbucketModalBody: FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const username = useEasyState('');
  const password = useEasyState('');
  const customDomain = useEasyState('');
  const { orgId } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useDispatch();
  const isLoading = useBoolState();

  const showCredentialsError = useEasyState<string>('');
  const showDomainError = useEasyState<string>('');

  const setCredentialsError = useCallback(
    (error: string) => {
      depFn(showCredentialsError.set, error);
    },
    [showCredentialsError.set]
  );

  const setDomainError = useCallback(
    (error: string) => {
      depFn(showDomainError.set, error);
    },
    [showDomainError.set]
  );

  const checkDomainWithRegex = (domain: string) => {
    const regex =
      /^(https:\/\/)?[a-zA-Z0-9]+([-.][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}(:[0-9]{1,5})?(\/.*)?$/;
    return regex.test(domain);
  };

  const handleUsernameChange = (e: string) => {
    username.set(e);
    showCredentialsError.set('');
  };

  const handlePasswordChange = (e: string) => {
    password.set(e);
    showCredentialsError.set('');
  };

  const handleDomainChange = (e: string) => {
    customDomain.set(e);
    showDomainError.set('');
  };

  const handleSubmission = useCallback(async () => {
    try {
      if (!username.value || !password.value) {
        setCredentialsError('Please enter a valid username and password');
        throw Error('Empty username or password');
      }

      if (customDomain.value && !checkDomainWithRegex(customDomain.value)) {
        setDomainError('Please enter a valid domain');
        throw Error('Invalid domain');
      }
    } catch (e) {
      console.error(e);
      return;
    }

    depFn(isLoading.true);
    await checkBitbucketValidity(username.value, password.value)
      .then(async (res) => {
        return res;
      })
      .then(async () => {
          const res = getMissingBitbucketPermissions(username.value, password.value);
          if ((await res).length) {
            throw new Error(`Token is missing scopes: ${(await res).join(', ')}`);
          }
      })
      // .then(async () => {
      //   try {
      //     return await linkProvider(username.value, orgId, password.value, Integration.BITBUCKET, {
      //       custom_domain: customDomain.value
      //     });
      //   } catch (e: any) {
      //     throw new Error(
      //       `Failed to link Bitbucket${e?.message ? `: ${e?.message}` : ''}`,
      //       e
      //     );
      //   }
      // })
      .then(() => {
        dispatch(fetchCurrentOrg());
        dispatch(
          fetchTeams({
            org_id: orgId
          })
        );
        enqueueSnackbar('Bitbucket linked successfully', {
          variant: 'success',
          autoHideDuration: 2000
        });
        onClose();
      })
      .catch((e) => {
        setCredentialsError(e.message);
        console.error(`Error while linking credentials: ${e.message}`, e);
      })
      .finally(isLoading.false);
  }, [
    // customDomain.value,
    dispatch,
    enqueueSnackbar,
    isLoading.false,
    isLoading.true,
    onClose,
    orgId,
    setDomainError,
    setCredentialsError,
    username.value,
    password.value
  ]);

  // const isDomainInputFocus = useBoolState(false);

  // const focusDomainInput = useCallback(() => {
  //   if (!customDomain.value)
  //     document.getElementById('bitbucket-custom-domain')?.focus();
  //   else handleSubmission();
  // }, [customDomain.value, handleSubmission]);

  return (
    <FlexBox gap2>
      <FlexBox gap={2} minWidth={'400px'} col>
        <FlexBox>
          Enter your Bitbucket username and password below{' '}
          <Line bigish ml={1 / 2} error>
            *
          </Line>
        </FlexBox>
        <FlexBox fullWidth col>
          <TextField
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                // focusDomainInput();
                return;
              }
            }}
            error={!!showCredentialsError.value}
            sx={{ width: '100%' }}
            value={username.value}
            onChange={(e) => {
              handleUsernameChange(e.currentTarget.value);
            }}
            label="Bitbucket Username"
            type="text"
          />
          <Line error tiny mt={1}>
            {showCredentialsError.value}
          </Line>
        </FlexBox>

        <FlexBox fullWidth col>
          <TextField
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                // focusDomainInput();
                return;
              }
            }}
            error={!!showCredentialsError.value}
            sx={{ width: '100%' }}
            value={password.value}
            onChange={(e) => {
              handlePasswordChange(e.currentTarget.value);
            }}
            label="Bitbucket Password"
            type="password"
          />
          <Line error tiny mt={1}>
            {showCredentialsError.value}
          </Line>
        </FlexBox>

        <FlexBox fullWidth minHeight={'50px'} col>
          {/* <FlexBox gap2 col> */}
            {/* <FlexBox alignBase gap1>
              Custom domain
            </FlexBox> */}
            {/* <TextField
              id="bitbucket-custom-domain"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  handleSubmission();
                  return;
                }
              }}
              error={!!showDomainError.value}
              sx={{ width: '100%' }}
              value={customDomain.value}
              onChange={(e) => handleDomainChange(e.currentTarget.value)}
              label={
                isDomainInputFocus.value || customDomain.value
                  ? 'Custom Domain'
                  : '(Optional)'
              }
              onFocus={isDomainInputFocus.true}
              onBlur={isDomainInputFocus.false}
            /> */}
          {/* </FlexBox> */}
          {/* <Line error tiny mt={1} minHeight={'18px'}>
            {showDomainError.value}
          </Line> */}
          <FlexBox>

            <Line tiny mt={1} primary sx={{ cursor: 'pointer' }}>
              <Link
                href="https://bitbucket.org/account/settings/app-passwords/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Line
                  underline
                  sx={{
                    textUnderlineOffset: '2px'
                  }}
                >
                  Generate new password
                </Line>
              </Link>
              <Line ml={'5px'}>{' ->'}</Line>
            </Line>
          </FlexBox>
        </FlexBox>

        <FlexBox justifyBetween alignCenter mt={'auto'}>
          <FlexBox col sx={{ opacity: 0.8 }}>
            <Line>Learn more about Bitbucket</Line>
            <Line>
              Personal Access Token (PAT)
              <Link
                ml={1 / 2}
                href="https://support.atlassian.com/bitbucket-cloud/docs/app-passwords/"
                target="_blank"
                rel="noopener noreferrer"
              >
                here
              </Link>
            </Line>
          </FlexBox>
          <FlexBox gap={2} justifyEnd>
            <LoadingButton
              loading={isLoading.value}
              variant="contained"
              onClick={handleSubmission}
            >
              Confirm
            </LoadingButton>
          </FlexBox>
        </FlexBox>
      </FlexBox>
      <Divider orientation="vertical" flexItem />
      <TokenPermissions />
    </FlexBox>
  );
};

const TokenPermissions = () => {
  const imageLoaded = useBoolState(false);

  const expandedStyles = useMemo(() => {
    const baseStyles = {
      border: `2px solid ${alpha('rgb(256,0,0)', 0.6)}`,
      transition: 'all 0.8s ease',
      borderRadius: '8px',
      opacity: 1,
      position: 'absolute',
      maxWidth: 'calc(100% - 48px)',
    };
    return [
      {
        width: '175px',
        height: '104px',
        top: '275px',
        left: '135px'
      },
      {
        width: '198px',
        height: '80px',
        top: '400px',
        left: '105px'
      },
      {
        width: '205px',
        height: '79px',
        top: '770px',
        left: '100px'
      },
      {
        width: '270px',
        height: '49px',
        top: '511px',
        left: '490px'
      },
    ].map((item) => ({ ...item, ...baseStyles }));
  }, []);


  return (
    <FlexBox col gap1 maxWidth={'100%'} overflow={'auto'}>
      <div
        style={{
          overflow: 'hidden',
          borderRadius: '12px',
          height: 'calc(100vh - 300px)',
          maxHeight: '976px',
          overflowY: 'auto',
          transition: 'all 0.8s ease',
          position: 'relative',
          maxWidth: '100%',
          background: '#000000'
        }}
      >
        <Image
          onLoadingComplete={imageLoaded.true}
          style={{
            position: 'relative',
            transition: 'all 0.8s ease',
            opacity: !imageLoaded.value ? 0 : 1,
            filter: 'invert(1)'
          }}
          src="/assets/bitbucketPAT.png"
          width={816}
          height={976}
          alt="PAT_permissions"
        />
        {expandedStyles.map((style, index) => (
          <div style={{ ...style, position: 'absolute' }} key={index} />
        ))}
      </div>
    </FlexBox>
  );
};
