// The same page for every approach. `data-check` marks the elements scripts/browser.ts measures.
import type {CSSProperties} from 'react';
import * as k from './kit';

const Info = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true">
    <circle cx="8" cy="8" r="6.5" />
    <path d="M8 7v4M8 5v.01" />
  </svg>
);

function Components({label}: {label: string}) {
  return (
    <>
      <div className="row">
        <k.Button data-check="solid">Save</k.Button>
        <k.Button variant="outline">Cancel</k.Button>
        <k.Button variant="ghost">Skip</k.Button>
        <k.Button size="sm">Small</k.Button>
        <k.Button size="lg">Large</k.Button>
        <k.Button disabled>Disabled</k.Button>
        <k.Button loading>Saving</k.Button>
      </div>
      <k.Alert tone="info" icon={<Info />} data-check="alert-info">
        <k.AlertTitle>Info</k.AlertTitle>
        <k.AlertDescription>Changes apply to new events only.</k.AlertDescription>
      </k.Alert>
      <k.Alert tone="ok">
        <k.AlertTitle>Saved</k.AlertTitle>
      </k.Alert>
      <k.Alert tone="warning">
        <k.AlertTitle>Check the date</k.AlertTitle>
      </k.Alert>
      <k.Alert tone="danger">
        <k.AlertTitle>Payment failed</k.AlertTitle>
        <k.AlertDescription>Update the card and try again.</k.AlertDescription>
      </k.Alert>
      <k.Alert tone="neutral" data-check="alert-neutral">
        <k.AlertTitle>Draft</k.AlertTitle>
      </k.Alert>
      <k.Tabs defaultValue="one" data-check="tabs">
        <k.TabsList aria-label={`${label} sections`}>
          <k.TabsTrigger value="one">Overview</k.TabsTrigger>
          <k.TabsTrigger value="two">Members</k.TabsTrigger>
          <k.TabsTrigger value="three">Billing</k.TabsTrigger>
        </k.TabsList>
        <k.TabsContent value="one">Overview panel</k.TabsContent>
        <k.TabsContent value="two">Members panel</k.TabsContent>
        <k.TabsContent value="three">Billing panel</k.TabsContent>
      </k.Tabs>
    </>
  );
}

export function Demo({styles, label}: {styles: k.Styles; label: string}) {
  return (
    <k.StylesProvider value={styles}>
      <section className="demo" aria-label={label} data-approach={label}>
        <h2>{label}</h2>
        <Components label={label} />
        <k.Dialog>
          <div className="row">
            <k.DialogTrigger data-check="dialog-trigger">Delete event</k.DialogTrigger>
          </div>
          <k.DialogContent>
            <k.DialogTitle>Delete this event?</k.DialogTitle>
            <k.DialogDescription>Attendees lose access. This cannot be undone.</k.DialogDescription>
            <k.DialogClose />
            <div className="row">
              <k.Button>Delete</k.Button>
            </div>
          </k.DialogContent>
        </k.Dialog>

        <h3>Subtree theme: midnight, blue</h3>
        <div className="subtree" data-theme="midnight" data-accent="blue" data-check="subtree">
          <Components label={`${label} midnight`} />
        </div>

        <h3>Consumer overrides</h3>
        <div className="row">
          <k.Button className="consumer-btn" data-check="override-class">
            className
          </k.Button>
          <div style={{'--btn-bg': 'rgb(0, 0, 255)'} as CSSProperties}>
            <k.Button data-check="override-var">--btn-bg</k.Button>
          </div>
          <div className="data-override">
            <k.Button variant="ghost" data-check="override-data">
              data-variant
            </k.Button>
          </div>
        </div>
        <k.Alert tone="danger">
          <k.AlertTitle className="consumer-title" data-check="override-class-title">
            className on a tone-coloured title
          </k.AlertTitle>
        </k.Alert>
        <div style={{'--accent': 'rgb(255, 0, 255)'} as CSSProperties}>
          <k.Alert tone="info" data-check="override-accent">
            <k.AlertTitle>--accent on a wrapper</k.AlertTitle>
          </k.Alert>
        </div>
        <div className="data-override">
          <k.Tabs defaultValue="a">
            <k.TabsList aria-label={`${label} override`}>
              <k.TabsTrigger value="a" data-check="override-data-state">
                data-state
              </k.TabsTrigger>
              <k.TabsTrigger value="b">Other</k.TabsTrigger>
            </k.TabsList>
            <k.TabsContent value="a">A</k.TabsContent>
            <k.TabsContent value="b">B</k.TabsContent>
          </k.Tabs>
        </div>
      </section>
    </k.StylesProvider>
  );
}
