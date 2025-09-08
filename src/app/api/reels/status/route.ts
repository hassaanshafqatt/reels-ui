import { NextRequest, NextResponse } from 'next/server';
import { JobRecord, getJob, getJobStoreSize, getAllJobIds, setJob } from '@/lib/jobStore';

// Import reel configs to get status URLs
const reelConfigs: Record<string, {
  message: string;
  caption: string;
  description: string;
  externalUrl?: string;
  statusUrl?: string;
}> = {
  'gym-motivation': {
    message: 'Gym motivation reel generated successfully',
    caption: 'Get motivated and crush your fitness goals! 💪 #GymMotivation #Fitness #Workout',
    description: 'High-energy motivational content for fitness enthusiasts',
    statusUrl: '/api/reels/gym-motivation/status'
  },
  'war-motivation': {
    message: 'War motivation/wisdom reel generated successfully',
    caption: 'Tactical wisdom from the greatest strategists in history ⚔️ #WarWisdom #Strategy #Motivation',
    description: 'Strategic wisdom and motivational content inspired by military leaders',
    statusUrl: '/api/reels/war-motivation/status'
  },
  'medieval-war': {
    message: 'Medieval war motivation reel generated successfully',
    caption: 'Honor, courage, and medieval wisdom for the modern warrior 🛡️ #Medieval #Honor #Courage',
    description: 'Medieval-inspired motivational content with themes of honor and bravery',
    statusUrl: '/api/reels/medieval-war/status'
  },
  'gangsters': {
    message: '1920s Gangsters reel generated successfully',
    caption: 'Class, respect, and old-school wisdom from the prohibition era 🎩 #Gangster #Respect #OldSchool',
    description: '1920s gangster-inspired content with themes of respect and old-school values',
    statusUrl: '/api/reels/gangsters/status'
  },
  'wisdom': {
    message: 'Wisdom reel generated successfully',
    caption: 'Ancient wisdom for modern times 🧠 #Wisdom #Proverbs #LifeLessons',
    description: 'Deep wisdom and life lessons through powerful proverbs',
    statusUrl: '/api/reels/wisdom/status'
  },
  'motivation': {
    message: 'Motivation reel generated successfully',
    caption: 'Motivational wisdom to fuel your journey ⚡ #Motivation #Inspiration #Success',
    description: 'Motivational proverbs and quotes to inspire action',
    statusUrl: '/api/reels/motivation/status'
  },
  'brotherhood': {
    message: 'Brotherhood reel generated successfully',
    caption: 'Brotherhood bonds that last a lifetime 🤝 #Brotherhood #Loyalty #Friendship',
    description: 'Content celebrating brotherhood, loyalty, and strong bonds',
    statusUrl: '/api/reels/brotherhood/status'
  },
  'bravery': {
    message: 'Bravery reel generated successfully',
    caption: 'Courage in the face of adversity ❤️ #Bravery #Courage #Strength',
    description: 'Inspiring content about courage, bravery, and overcoming challenges',
    statusUrl: '/api/reels/bravery/status'
  },
  'theory': {
    message: 'Anime theory reel generated successfully',
    caption: 'Mind-blowing anime theories and analysis 🧠 #Anime #Theory #Analysis',
    description: 'Deep dive into anime theories and character analysis',
    externalUrl: 'https://n8n.nutrador.com/webhook-test/d1eb881a-33e3-4051-ba1f-1a1f31ba8b69',
    statusUrl: 'https://n8n.nutrador.com/webhook-test/2a357088-6f10-4d2a-8e26-67dfab8504b5'
  },
  'anime-painting': {
    message: 'Anime painting reel generated successfully',
    caption: 'Beautiful anime art coming to life 🎨 #Anime #Art #Painting #Digital',
    description: 'Anime-style painting and digital art creation content',
    statusUrl: '/api/reels/anime-painting/status'
  },
  'asmr-food': {
    message: 'ASMR food reel generated successfully',
    caption: 'Satisfying food sounds and visuals 🍽️ #ASMR #Food #Satisfying #Relaxing',
    description: 'Relaxing and satisfying food-related ASMR content',
    statusUrl: '/api/reels/asmr-food/status'
  },
  'asmr-animal': {
    message: 'ASMR animal reel generated successfully',
    caption: 'Peaceful animal sounds and moments 🐾 #ASMR #Animals #Peaceful #Nature',
    description: 'Relaxing animal-related ASMR content with nature sounds',
    statusUrl: '/api/reels/asmr-animal/status'
  }
};

export async function GET(request: NextRequest) {
  try {
    console.log('Status GET request received');
    const url = new URL(request.url);
    const jobId = url.searchParams.get('jobId');
    const type = url.searchParams.get('type');

    console.log(`Checking status for jobId: ${jobId}, type: ${type}`);
    console.log(`Current job store size: ${getJobStoreSize()}`);
    console.log(`All job IDs in store: ${getAllJobIds().join(', ')}`);

    if (!jobId || !type) {
      console.log('Missing required parameters');
      return NextResponse.json({ error: 'jobId and type parameters are required' }, { status: 400 });
    }

    const jobRecord = getJob(jobId);
    if (!jobRecord) {
      console.log(`Job not found in store for ID: ${jobId}`);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Get the reel config for this type
    const config = reelConfigs[type];
    if (!config) {
      console.log(`Unknown reel type: ${type}`);
      return NextResponse.json({ error: 'Unknown reel type' }, { status: 400 });
    }

    // If there's a status URL, hit it with the job ID
    if (config.statusUrl) {
      try {
        const isExternalUrl = config.statusUrl.startsWith('http');
        const statusUrl = isExternalUrl ? config.statusUrl : `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${config.statusUrl}`;
        
        console.log(`Hitting status URL: ${statusUrl} with jobId: ${jobId}`);
        
        const statusResponse = await fetch(`${statusUrl}?jobId=${jobId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (statusResponse.ok) {
          const statusResult = await statusResponse.json();
          console.log(`Status URL response:`, statusResult);
          
          // Extract status and other relevant information from the response
          let newStatus = jobRecord.status; // Default to current status
          let reelLink = null;
          const updatedResult = statusResult;
          let errorMessage = null;
          
          // Check for errors in the response first
          if (statusResult.error || statusResult.message?.includes('error') || statusResult.message?.includes('Error')) {
            newStatus = 'failed';
            errorMessage = statusResult.error || statusResult.message || 'Unknown error from status check';
            console.log(`Error detected in status response, setting status to failed: ${errorMessage}`);
          }
          // Try to extract status from common response formats if no error
          else if (statusResult.status) {
            newStatus = statusResult.status;
          } else if (statusResult.state) {
            newStatus = statusResult.state;
          } else if (statusResult.job_status) {
            newStatus = statusResult.job_status;
          }
          // If no status field found and no error, assume failed
          else {
            newStatus = 'failed';
            errorMessage = 'No status found in response';
            console.log(`No status field found in response, setting to failed`);
          }
          
          // Try to extract reel link from common response formats
          if (statusResult.reelUrl) {
            reelLink = statusResult.reelUrl;
          } else if (statusResult.videoUrl) {
            reelLink = statusResult.videoUrl;
          } else if (statusResult.downloadUrl) {
            reelLink = statusResult.downloadUrl;
          } else if (statusResult.url) {
            reelLink = statusResult.url;
          } else if (statusResult.link) {
            reelLink = statusResult.link;
          }
          
          // Update the job record with the new status information
          const updatedJob: JobRecord = {
            ...jobRecord,
            status: newStatus as JobRecord['status'],
            updatedAt: new Date().toISOString(),
            result: updatedResult,
            error: errorMessage || jobRecord.error
          };
          
          setJob(jobId, updatedJob);
          console.log(`Updated job ${jobId} with new status: ${newStatus}${errorMessage ? `, error: ${errorMessage}` : ''}`);
          
          return NextResponse.json({
            jobId: updatedJob.jobId,
            type: updatedJob.type,
            category: updatedJob.category,
            status: updatedJob.status,
            createdAt: updatedJob.createdAt,
            updatedAt: updatedJob.updatedAt,
            result: updatedJob.result,
            error: updatedJob.error,
            reelLink: reelLink
          });
        } else {
          console.log(`Status URL returned error: ${statusResponse.status}`);
        }
      } catch (statusError) {
        console.error(`Error calling status URL:`, statusError);
      }
    }

    // Return the stored job record if no status URL or if status URL failed
    console.log(`Returning stored job record:`, jobRecord);
    return NextResponse.json({
      jobId: jobRecord.jobId,
      type: jobRecord.type,
      category: jobRecord.category,
      status: jobRecord.status,
      createdAt: jobRecord.createdAt,
      updatedAt: jobRecord.updatedAt,
      result: jobRecord.result,
      error: jobRecord.error
    });
  } catch (error) {
    console.error('Error checking job status:', error);
    return NextResponse.json({ error: 'Failed to check job status' }, { status: 500 });
  }
}
