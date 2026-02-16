# CDK Integration

CDK integration is under active development. Documentation coming soon.

## Overview

Mono includes experimental support for AWS CDK infrastructure-as-code via the `@mono-labs/cli/stack` export, which provides a `CustomStack` abstract class for building CDK stacks with built-in configuration for regions, domains, and NAT gateways.

```typescript
import { CustomStack } from "@mono-labs/cli/stack";
```

## Related

- [Main README](../README.md)
- [Infrastructure Integration](infrastructure-integration.md)
