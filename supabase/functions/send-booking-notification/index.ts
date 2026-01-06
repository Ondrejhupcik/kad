import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface BookingNotification {
  hairdresserEmail: string;
  hairdresserName: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  startTime: string;
  endTime: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const booking: BookingNotification = await req.json();

    // Format times for display
    const startDate = new Date(booking.startTime);
    const endDate = new Date(booking.endTime);
    const dateStr = startDate.toLocaleDateString('sk-SK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = `${startDate.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}`;

    // EMAIL NOTIFICATION TO HAIRDRESSER
    // In production, integrate with email service (SendGrid, Resend, etc.)
    console.log('Email notification to hairdresser:', {
      to: booking.hairdresserEmail,
      subject: `Nová rezervácia - ${booking.clientName}`,
      body: `
        Dobrý deň ${booking.hairdresserName},
        
        Máte novú rezerváciu:
        
        Zákazník: ${booking.clientName}
        Telefón: ${booking.clientPhone}
        Služba: ${booking.serviceName}
        Dátum: ${dateStr}
        Čas: ${timeStr}
        
        Prihláste sa do svojho účtu pre viac detailov.
      `,
    });

    // SMS NOTIFICATION TO CUSTOMER
    // In production, integrate with SMS service (Twilio, local provider, etc.)
    console.log('SMS notification to customer:', {
      to: booking.clientPhone,
      body: `Vaša rezervácia u ${booking.hairdresserName} bola vytvorená. ${dateStr}, ${timeStr}. Služba: ${booking.serviceName}.`,
    });

    // Simulate notification success
    const response = {
      success: true,
      message: 'Notifikácie boli odoslané',
      emailSent: true,
      smsSent: true,
      // In production, return actual delivery status from providers
    };

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error sending notifications:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});