import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityRestrictedComponent } from './security-restricted.component';

describe('SecurityRestrictedComponent', () => {
  let component: SecurityRestrictedComponent;
  let fixture: ComponentFixture<SecurityRestrictedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityRestrictedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecurityRestrictedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
